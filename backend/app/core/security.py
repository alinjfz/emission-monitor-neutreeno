"""Password, session-token, origin, and current-user security helpers."""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.time import utc_now
from app.db.session import get_db
from app.models.session import AuthSession
from app.models.user import User

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a raw password with the configured Argon2id parameters."""
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Treat a malformed stored hash like a mismatch instead of leaking an error."""
    try:
        return password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def new_session_token() -> str:
    """Create the opaque credential sent only to the user's HTTP-only cookie."""
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Hash bearer credentials before persistence so the database cannot replay them."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def session_expiry(settings: Settings) -> datetime:
    """Calculate a new session's UTC expiration from configured lifetime days."""
    return utc_now() + timedelta(days=settings.session_days)


def require_allowed_origin(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    """Reject state-changing browser requests from untrusted origins (CSRF defense)."""
    origin = request.headers.get("origin", "").rstrip("/")
    if not origin or origin not in settings.allowed_origin_set:
        raise AppError(403, "invalid_origin", "This request origin is not allowed.")


def get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    """Resolve a raw cookie through its stored hash to a live user.

    Missing or unknown tokens return HTTP 401. Expired sessions are deleted before a
    distinct expiry response is returned; raw bearer tokens are never persisted.
    """
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise AppError(401, "authentication_required", "Please log in to continue.")

    auth_session = db.scalar(
        select(AuthSession)
        .options(joinedload(AuthSession.user))
        .where(AuthSession.token_hash == hash_session_token(token))
    )
    if auth_session is None:
        raise AppError(401, "authentication_required", "Please log in to continue.")
    if auth_session.expires_at <= utc_now():
        db.delete(auth_session)
        db.commit()
        raise AppError(401, "session_expired", "Your session expired. Please log in again.")
    return auth_session.user


CurrentUser = Annotated[User, Depends(get_current_user)]
