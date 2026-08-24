from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utc_now
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.review_event import ReviewEvent
    from app.models.session import AuthSession


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(30), default="reviewer")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    session: Mapped["AuthSession | None"] = relationship(back_populates="user", uselist=False)
    review_events: Mapped[list["ReviewEvent"]] = relationship(back_populates="reviewer")
