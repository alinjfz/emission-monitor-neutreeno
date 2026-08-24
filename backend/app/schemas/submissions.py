from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import Field, field_validator

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


class ReviewRequest(ApiModel):
    action: Literal["approved", "rejected"]
    comment: str | None = Field(default=None, max_length=500)
    expected_version: int = Field(ge=1)

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None
