from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING

from app.core.time import utc_now
from app.db.base import Base
from app.db.types import ScaledDecimal
from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.review_event import ReviewEvent


class SubmissionStatus(StrEnum):
    NEW = "new"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class UnitCode(StrEnum):
    PER_ITEM = "per_item"
    PER_KG = "per_kg"


class FootprintSubmission(Base):
    __tablename__ = "footprint_submissions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('new', 'pending', 'approved', 'rejected')", name="ck_submission_status"
        ),
        CheckConstraint("unit_code IN ('per_item', 'per_kg')", name="ck_submission_unit"),
        CheckConstraint(
            "footprint_value_micros BETWEEN 0 AND 999999999999999999",
            name="ck_submission_footprint_range",
        ),
        CheckConstraint(
            "uncertainty_basis_points BETWEEN 0 AND 10000",
            name="ck_submission_uncertainty_range",
        ),
        CheckConstraint("period_end >= period_start", name="ck_submission_period"),
        CheckConstraint("version >= 1", name="ck_submission_version"),
        Index("ix_submissions_queue", "status", "submitted_at", "updated_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default=SubmissionStatus.NEW.value)
    footprint_value: Mapped[Decimal] = mapped_column(
        "footprint_value_micros", ScaledDecimal(6), nullable=False
    )
    unit_code: Mapped[str] = mapped_column(String(20))
    uncertainty: Mapped[Decimal] = mapped_column(
        "uncertainty_basis_points", ScaledDecimal(2), nullable=False
    )
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    methodology: Mapped[str] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)

    product: Mapped["Product"] = relationship(back_populates="submissions")
    review_events: Mapped[list["ReviewEvent"]] = relationship(
        back_populates="submission",
        order_by="ReviewEvent.created_at.desc(), ReviewEvent.id.desc()",
    )
