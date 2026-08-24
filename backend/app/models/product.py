from datetime import datetime
from typing import TYPE_CHECKING

from app.core.time import utc_now
from app.db.base import Base
from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.footprint_submission import FootprintSubmission
    from app.models.supplier import Supplier


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (UniqueConstraint("supplier_id", "code", name="uq_products_supplier_code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    code: Mapped[str] = mapped_column(String(50), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    supplier: Mapped["Supplier"] = relationship(back_populates="products")
    submissions: Mapped[list["FootprintSubmission"]] = relationship(back_populates="product")
