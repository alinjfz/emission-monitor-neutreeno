from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import AppError
from app.core.security import (
    hash_password,
    hash_session_token,
    new_session_token,
    session_expiry,
    verify_password,
)
from app.models.session import AuthSession
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


def issue_session(db: Session, user: User, settings: Settings) -> str:
    existing = db.scalar(select(AuthSession).where(AuthSession.user_id == user.id))
    if existing is not None:
        db.delete(existing)
        db.flush()
    raw_token = new_session_token()
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash=hash_session_token(raw_token),
            expires_at=session_expiry(settings),
        )
    )
    return raw_token


def register_user(db: Session, payload: RegisterRequest, settings: Settings) -> tuple[User, str]:
    email = str(payload.email).lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise AppError(
            409,
            "email_in_use",
            "An account with this email already exists.",
            field_errors={"email": ["This email is already registered."]},
        )
    user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        role="reviewer",
    )
    db.add(user)
    db.flush()
    token = issue_session(db, user, settings)
    db.commit()
    return user, token


def login_user(db: Session, payload: LoginRequest, settings: Settings) -> tuple[User, str]:
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise AppError(401, "invalid_credentials", "Email or password is incorrect.")
    token = issue_session(db, user, settings)
    db.commit()
    return user, token


def logout_user(db: Session, token: str | None) -> None:
    if token:
        auth_session = db.scalar(
            select(AuthSession).where(AuthSession.token_hash == hash_session_token(token))
        )
        if auth_session is not None:
            db.delete(auth_session)
            db.commit()
