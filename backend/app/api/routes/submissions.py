"""HTTP contract for submissions; use cases and transactions live in services."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlalchemy.orm import Session

from app.core.security import CurrentUser, require_allowed_origin
from app.db.session import get_db
from app.schemas.submissions import (
    ReviewRequest,
    SubmissionCreateRequest,
    SubmissionDetailOut,
    SubmissionListOut,
    SubmissionUpdateRequest,
)
from app.services.submissions import (
    create_submission,
    delete_submission,
    get_submission,
    list_submissions,
    open_submission,
    review_submission,
    update_submission,
)

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

# Literal query types make FastAPI reject unsupported filters/sorts before they
# reach SQL construction and mirror the frontend's central API types.
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


@router.get("", response_model=SubmissionListOut)
def list_all(
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    status: Annotated[ListStatus, Query()] = "all",
    search: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    sort: Annotated[SortName, Query()] = "queue",
    direction: Annotated[Direction, Query()] = "asc",
    page: Annotated[int, Query(ge=1, le=10_000)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
) -> SubmissionListOut:
    """Return one authenticated, validated page of the review queue."""
    return list_submissions(
        db,
        status=status,
        search=search,
        sort=sort,
        direction=direction,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=SubmissionDetailOut, status_code=status.HTTP_201_CREATED)
def create(
    payload: SubmissionCreateRequest,
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    _origin: Annotated[None, Depends(require_allowed_origin)],
) -> SubmissionDetailOut:
    """Create a submission from user-editable fields."""
    # Every cookie-authenticated write also requires an allowlisted browser origin.
    return create_submission(db, payload)


@router.get("/{submission_id}", response_model=SubmissionDetailOut)
def retrieve(
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    submission_id: Annotated[int, Path(ge=1)],
) -> SubmissionDetailOut:
    """Return a submission together with its complete review history."""
    return get_submission(db, submission_id)


@router.patch("/{submission_id}", response_model=SubmissionDetailOut)
def update(
    payload: SubmissionUpdateRequest,
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    submission_id: Annotated[int, Path(ge=1)],
    _origin: Annotated[None, Depends(require_allowed_origin)],
) -> SubmissionDetailOut:
    """Replace the editable fields of an existing submission."""
    return update_submission(db, submission_id, payload)


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    submission_id: Annotated[int, Path(ge=1)],
    _origin: Annotated[None, Depends(require_allowed_origin)],
) -> Response:
    """Delete a submission and return an empty success response."""
    delete_submission(db, submission_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{submission_id}/open", response_model=SubmissionDetailOut)
def open_detail(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    submission_id: Annotated[int, Path(ge=1)],
    _origin: Annotated[None, Depends(require_allowed_origin)],
) -> SubmissionDetailOut:
    """Open a submission, performing its one-time pending transition if needed."""
    return open_submission(db, submission_id, user)


@router.post("/{submission_id}/reviews", response_model=SubmissionDetailOut)
def review(
    payload: ReviewRequest,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    submission_id: Annotated[int, Path(ge=1)],
    _origin: Annotated[None, Depends(require_allowed_origin)],
) -> SubmissionDetailOut:
    """Record an optimistic-concurrency-protected approval or rejection."""
    return review_submission(db, submission_id, user, payload)
