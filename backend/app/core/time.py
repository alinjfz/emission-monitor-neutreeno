"""UTC clock abstraction shared by persistence and services."""

from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return a naive datetime whose value is UTC for SQLite portability."""
    return datetime.now(UTC).replace(tzinfo=None)
