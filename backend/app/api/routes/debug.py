"""Explicitly gated development-only maintenance endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import CurrentUser, require_allowed_origin
from app.db.session import get_db
from app.services.database import reseed_database

router = APIRouter(prefix="/api/debug", tags=["debug"])


@router.post("/reseed", status_code=status.HTTP_204_NO_CONTENT)
def reseed(
    response: Response,
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    _origin: Annotated[None, Depends(require_allowed_origin)],
) -> Response:
    """Reset demo data when the explicitly enabled development flag permits it."""
    if not settings.enable_database_reseed:
        # A 404 hides an intentionally disabled debug surface from production clients.
        raise AppError(404, "not_found", "This endpoint is not available.")

    reseed_database(db)
    response.delete_cookie(settings.cookie_name, path="/", samesite="lax")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
