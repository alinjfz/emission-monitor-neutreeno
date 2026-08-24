from collections.abc import Sequence
from typing import Literal

from sqlalchemy import case, func, or_, select, update
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.errors import AppError
from app.core.time import utc_now
from app.models.footprint_submission import FootprintSubmission, SubmissionStatus
from app.models.product import Product
from app.models.review_event import ReviewAction, ReviewEvent
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.submissions import (
    ProductOut,
    ReviewerOut,
    ReviewEventOut,
    ReviewRequest,
    StatusCounts,
    SubmissionDetailOut,
    SubmissionListOut,
    SubmissionSummaryOut,
    SupplierOut,
)

ListStatus = Literal["all", "new", "pending", "approved", "rejected"]
SortName = Literal[
    "queue",
    "product",
    "supplier",
    "status",
    "footprint",
    "uncertainty",
    "period_start",
    "period_end",
    "duration",
    "submitted_at",
    "last_modified_at",
]
Direction = Literal["asc", "desc"]


def _load_options():
    return (
        joinedload(FootprintSubmission.product).joinedload(Product.supplier),
        selectinload(FootprintSubmission.review_events).joinedload(ReviewEvent.reviewer),
    )


def _event_out(event: ReviewEvent) -> ReviewEventOut:
    return ReviewEventOut(
        id=event.id,
        action=event.action,
        comment=event.comment,
        created_at=event.created_at,
        reviewer=ReviewerOut(id=event.reviewer.id, name=event.reviewer.name),
    )


def _summary_out(submission: FootprintSubmission) -> SubmissionSummaryOut:
    history = sorted(
        submission.review_events, key=lambda event: (event.created_at, event.id), reverse=True
    )
    return SubmissionSummaryOut(
        id=submission.id,
        status=submission.status,
        version=submission.version,
        product=ProductOut(
            id=submission.product.id,
            name=submission.product.name,
            code=submission.product.code,
        ),
        supplier=SupplierOut(
            id=submission.product.supplier.id,
            name=submission.product.supplier.name,
        ),
        footprint_value=submission.footprint_value,
        unit_code=submission.unit_code,
        uncertainty=submission.uncertainty,
        period_start=submission.period_start,
        period_end=submission.period_end,
        methodology=submission.methodology,
        submitted_at=submission.submitted_at,
        updated_at=submission.updated_at,
        last_modified_at=history[0].created_at if history else submission.submitted_at,
        latest_review=_event_out(history[0]) if history else None,
    )


def _detail_out(submission: FootprintSubmission) -> SubmissionDetailOut:
    summary = _summary_out(submission)
    history = sorted(
        submission.review_events, key=lambda event: (event.created_at, event.id), reverse=True
    )
    return SubmissionDetailOut(
        **summary.model_dump(),
        review_history=[_event_out(event) for event in history],
    )


def _get_submission(db: Session, submission_id: int) -> FootprintSubmission:
    submission = db.scalar(
        select(FootprintSubmission)
        .options(*_load_options())
        .where(FootprintSubmission.id == submission_id)
    )
    if submission is None:
        raise AppError(404, "submission_not_found", "Submission not found.")
    return submission


def get_submission(db: Session, submission_id: int) -> SubmissionDetailOut:
    return _detail_out(_get_submission(db, submission_id))


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _search_conditions(search: str | None) -> Sequence:
    if not search:
        return ()
    pattern = f"%{_escape_like(search.strip())}%"
    return (
        or_(
            Product.name.ilike(pattern, escape="\\"),
            Product.code.ilike(pattern, escape="\\"),
            Supplier.name.ilike(pattern, escape="\\"),
        ),
    )


def list_submissions(
    db: Session,
    *,
    status: ListStatus,
    search: str | None,
    sort: SortName,
    direction: Direction,
    page: int,
    page_size: int,
) -> SubmissionListOut:
    search_conditions = _search_conditions(search)
    base_join = select(FootprintSubmission).join(FootprintSubmission.product).join(Product.supplier)

    count_rows = db.execute(
        select(FootprintSubmission.status, func.count(FootprintSubmission.id))
        .join(FootprintSubmission.product)
        .join(Product.supplier)
        .where(*search_conditions)
        .group_by(FootprintSubmission.status)
    ).all()
    count_map = {name: count for name, count in count_rows}
    counts = StatusCounts(
        all=sum(count_map.values()),
        new=count_map.get("new", 0),
        pending=count_map.get("pending", 0),
        approved=count_map.get("approved", 0),
        rejected=count_map.get("rejected", 0),
    )

    conditions = list(search_conditions)
    if status != "all":
        conditions.append(FootprintSubmission.status == status)

    total = (
        db.scalar(
            select(func.count(FootprintSubmission.id))
            .join(FootprintSubmission.product)
            .join(Product.supplier)
            .where(*conditions)
        )
        or 0
    )

    statement = base_join.options(*_load_options()).where(*conditions)
    latest_review_at = (
        select(func.max(ReviewEvent.created_at))
        .where(ReviewEvent.submission_id == FootprintSubmission.id)
        .correlate(FootprintSubmission)
        .scalar_subquery()
    )
    last_modified_at = func.coalesce(latest_review_at, FootprintSubmission.submitted_at)
    if sort == "queue":
        unresolved = (SubmissionStatus.NEW.value, SubmissionStatus.PENDING.value)
        statement = statement.order_by(
            case((FootprintSubmission.status.in_(unresolved), 0), else_=1),
            case(
                (FootprintSubmission.status.in_(unresolved), FootprintSubmission.submitted_at)
            ).asc(),
            case((~FootprintSubmission.status.in_(unresolved), last_modified_at)).desc(),
            FootprintSubmission.id.asc(),
        )
    else:
        sort_columns = {
            "product": Product.name,
            "supplier": Supplier.name,
            "status": FootprintSubmission.status,
            "footprint": FootprintSubmission.footprint_value,
            "uncertainty": FootprintSubmission.uncertainty,
            "period_start": FootprintSubmission.period_start,
            "period_end": FootprintSubmission.period_end,
            "duration": func.julianday(FootprintSubmission.period_end)
            - func.julianday(FootprintSubmission.period_start)
            + 1,
            "submitted_at": FootprintSubmission.submitted_at,
            "last_modified_at": last_modified_at,
        }
        selected_sort = sort_columns[sort]
        statement = statement.order_by(
            selected_sort.desc() if direction == "desc" else selected_sort.asc(),
            FootprintSubmission.id.asc(),
        )

    submissions = (
        db.scalars(statement.offset((page - 1) * page_size).limit(page_size)).unique().all()
    )
    return SubmissionListOut(
        items=[_summary_out(submission) for submission in submissions],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
        status_counts=counts,
    )


def open_submission(db: Session, submission_id: int, reviewer: User) -> SubmissionDetailOut:
    changed_at = utc_now()
    result = db.execute(
        update(FootprintSubmission)
        .where(
            FootprintSubmission.id == submission_id,
            FootprintSubmission.status == SubmissionStatus.NEW.value,
        )
        .values(
            status=SubmissionStatus.PENDING.value,
            version=FootprintSubmission.version + 1,
            updated_at=changed_at,
        )
    )
    if result.rowcount == 1:
        db.add(
            ReviewEvent(
                submission_id=submission_id,
                reviewer_id=reviewer.id,
                action=ReviewAction.OPENED.value,
                created_at=changed_at,
            )
        )
        db.commit()
    else:
        db.rollback()
        if (
            db.scalar(select(FootprintSubmission.id).where(FootprintSubmission.id == submission_id))
            is None
        ):
            raise AppError(404, "submission_not_found", "Submission not found.")
    return _detail_out(_get_submission(db, submission_id))


def review_submission(
    db: Session,
    submission_id: int,
    reviewer: User,
    payload: ReviewRequest,
) -> SubmissionDetailOut:
    changed_at = utc_now()
    result = db.execute(
        update(FootprintSubmission)
        .where(
            FootprintSubmission.id == submission_id,
            FootprintSubmission.version == payload.expected_version,
        )
        .values(
            status=payload.action,
            version=FootprintSubmission.version + 1,
            updated_at=changed_at,
        )
    )
    if result.rowcount != 1:
        db.rollback()
        latest = db.scalar(
            select(FootprintSubmission)
            .options(*_load_options())
            .where(FootprintSubmission.id == submission_id)
        )
        if latest is None:
            raise AppError(404, "submission_not_found", "Submission not found.")
        raise AppError(
            409,
            "submission_conflict",
            "Another reviewer updated this submission. The latest version is shown.",
            latest_submission=_detail_out(latest),
        )

    db.add(
        ReviewEvent(
            submission_id=submission_id,
            reviewer_id=reviewer.id,
            action=payload.action,
            comment=payload.comment,
            created_at=changed_at,
        )
    )
    db.commit()
    return _detail_out(_get_submission(db, submission_id))
