"""Database engine construction and request-scoped session dependency."""

from collections.abc import Generator

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def build_engine(database_url: str) -> Engine:
    """Create an engine with SQLite safety/concurrency settings when applicable."""
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    database_engine = create_engine(database_url, connect_args=connect_args)

    if database_url.startswith("sqlite"):

        @event.listens_for(database_engine, "connect")
        def configure_sqlite(dbapi_connection, _connection_record) -> None:  # type: ignore[no-untyped-def]
            """Apply required integrity and concurrency pragmas to each connection."""
            cursor = dbapi_connection.cursor()
            # SQLite does not enforce foreign keys unless each connection opts in.
            cursor.execute("PRAGMA foreign_keys = ON")
            # WAL allows readers during writes; busy_timeout smooths brief lock races.
            cursor.execute("PRAGMA journal_mode = WAL")
            cursor.execute("PRAGMA busy_timeout = 5000")
            cursor.close()

    return database_engine


engine = build_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """Yield one SQLAlchemy session for the lifetime of a FastAPI request."""
    with SessionLocal() as session:
        try:
            yield session
        finally:
            session.close()
