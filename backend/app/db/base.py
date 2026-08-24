"""Shared SQLAlchemy metadata root used by models, migrations, and tests."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import model modules after Base exists so every table registers on Base.metadata.
from app.models import (  # noqa: E402,F401
    footprint_submission,
    product,
    review_event,
    session,
    supplier,
    user,
)
