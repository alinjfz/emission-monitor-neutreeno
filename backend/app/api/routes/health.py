"""Liveness endpoint that also verifies the database accepts a simple query."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health(db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    """Confirm that the API and its database connection are responsive."""
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
