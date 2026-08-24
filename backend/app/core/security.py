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
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def session_expiry(settings: Settings) -> datetime:
    return utc_now() + timedelta(days=settings.session_days)


def require_allowed_origin(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    origin = request.headers.get("origin", "").rstrip("/")
    if not origin or origin not in settings.allowed_origin_set:
        raise AppError(403, "invalid_origin", "This request origin is not allowed.")


def get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
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
