from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from app.core.time import utc_now
from app.db.base import Base
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.footprint_submission import FootprintSubmission
    from app.models.user import User


class ReviewAction(StrEnum):
    OPENED = "opened"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReviewEvent(Base):
    __tablename__ = "review_events"
    __table_args__ = (
        CheckConstraint(
            "action IN ('opened', 'approved', 'rejected')", name="ck_review_event_action"
        ),
        Index("ix_review_events_submission_created", "submission_id", "created_at"),
        Index(
            "uq_review_events_one_opened_per_submission",
            "submission_id",
            unique=True,
            sqlite_where=text("action = 'opened'"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("footprint_submissions.id"))
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(20))
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    submission: Mapped["FootprintSubmission"] = relationship(back_populates="review_events")
    reviewer: Mapped["User"] = relationship(back_populates="review_events")
