from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utc_now
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.product import Product


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    products: Mapped[list["Product"]] = relationship(back_populates="supplier")
