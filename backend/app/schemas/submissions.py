"""Validated request and response contracts for the submission feature."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import Field, field_validator, model_validator

from app.schemas.common import ApiModel


class SupplierOut(ApiModel):
    id: int
    name: str


class ProductOut(ApiModel):
    id: int
    name: str
    code: str


class ReviewerOut(ApiModel):
    id: int
    name: str


class ReviewEventOut(ApiModel):
    id: int
    action: Literal["opened", "approved", "rejected"]
    comment: str | None
    created_at: datetime
    reviewer: ReviewerOut


class SubmissionSummaryOut(ApiModel):
    """List-row shape; Decimal fields serialize as exact JSON strings."""

    id: int
    status: Literal["new", "pending", "approved", "rejected"]
    version: int
    product: ProductOut
    supplier: SupplierOut
    footprint_value: Decimal
    unit_code: Literal["per_item", "per_kg"]
    uncertainty: Decimal
    period_start: date
    period_end: date
    methodology: str
    submitted_at: datetime
    updated_at: datetime
    last_modified_at: datetime
    latest_review: ReviewEventOut | None


class SubmissionDetailOut(SubmissionSummaryOut):
    """Summary plus the complete, newest-first audit history."""

    review_history: list[ReviewEventOut]


class StatusCounts(ApiModel):
    all: int
    new: int
    pending: int
    approved: int
    rejected: int


class SubmissionListOut(ApiModel):
    items: list[SubmissionSummaryOut]
    page: int
    page_size: int
    total: int
    total_pages: int
    status_counts: StatusCounts


class SubmissionFields(ApiModel):
    """User-editable fields shared by create and full-update requests."""

    supplier_name: str = Field(min_length=1, max_length=140)
    product_name: str = Field(min_length=1, max_length=160)
    product_code: str = Field(min_length=1, max_length=50)
    footprint_value: Decimal = Field(
        ge=Decimal("0"),
        le=Decimal("999999999999.999999"),
        decimal_places=6,
    )
    unit_code: Literal["per_item", "per_kg"]
    uncertainty: Decimal = Field(
        ge=Decimal("0"),
        le=Decimal("100"),
        decimal_places=2,
    )
    period_start: date
    period_end: date
    methodology: str = Field(min_length=1, max_length=2_000)

    # Field validators normalize one value; model validators compare fields.
    @field_validator("supplier_name", "product_name", "product_code", "methodology")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        """Store user content without accidental leading/trailing whitespace."""
        return value.strip()

    @model_validator(mode="after")
    def validate_period(self) -> "SubmissionFields":
        """Require an inclusive reporting period whose end is not before its start."""
        if self.period_end < self.period_start:
            raise ValueError("Reporting period end must be on or after its start.")
        return self


class SubmissionCreateRequest(SubmissionFields):
    pass


class SubmissionUpdateRequest(SubmissionFields):
    pass


class ReviewRequest(ApiModel):
    """Decision command carrying the version the reviewer actually saw."""

    action: Literal["approved", "rejected"]
    comment: str | None = Field(default=None, max_length=500)
    expected_version: int = Field(ge=1)

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: str | None) -> str | None:
        """Preserve the invariant that blank comments are represented as null."""
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None
