from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import CurrentUser, require_allowed_origin
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, UserOut
from app.services.auth import login_user, logout_user, register_user

router = APIRouter(prefix="/api/auth", tags=["authentication"])


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        max_age=settings.session_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> UserOut:
    user, token = register_user(db, payload, settings)
    set_session_cookie(response, token, settings)
    return UserOut.model_validate(user)


@router.post("/login", response_model=UserOut)
def login(
    payload: LoginRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> UserOut:
    user, token = login_user(db, payload, settings)
    set_session_cookie(response, token, settings)
    return UserOut.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    _origin: Annotated[None, Depends(require_allowed_origin)],
) -> Response:
    logout_user(db, request.cookies.get(settings.cookie_name))
    response.delete_cookie(settings.cookie_name, path="/", samesite="lax")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)
