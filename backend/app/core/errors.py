import logging
from collections.abc import Mapping
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        *,
        field_errors: Mapping[str, list[str]] | None = None,
        latest_submission: Any | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.field_errors = dict(field_errors) if field_errors else None
        self.latest_submission = latest_submission
        super().__init__(message)


def error_response(
    status_code: int,
    code: str,
    message: str,
    *,
    field_errors: Mapping[str, list[str]] | None = None,
    latest_submission: Any | None = None,
) -> JSONResponse:
    error: dict[str, Any] = {"code": code, "message": message}
    if field_errors:
        error["field_errors"] = dict(field_errors)
    if latest_submission is not None:
        error["latest_submission"] = latest_submission
    return JSONResponse(status_code=status_code, content={"error": error})


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
        latest = exc.latest_submission
        if hasattr(latest, "model_dump"):
            latest = latest.model_dump(mode="json")
        return error_response(
            exc.status_code,
            exc.code,
            exc.message,
            field_errors=exc.field_errors,
            latest_submission=latest,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation(_request: Request, exc: RequestValidationError) -> JSONResponse:
        fields: dict[str, list[str]] = {}
        for issue in exc.errors():
            path = [str(part) for part in issue["loc"] if part not in {"body", "query", "path"}]
            key = ".".join(path) or "request"
            fields.setdefault(key, []).append(issue["msg"])
        return error_response(
            422,
            "validation_error",
            "Please correct the highlighted fields.",
            field_errors=fields,
        )

    @app.exception_handler(HTTPException)
    async def handle_http_error(_request: Request, exc: HTTPException) -> JSONResponse:
        message = (
            exc.detail if isinstance(exc.detail, str) else "The request could not be completed."
        )
        return error_response(exc.status_code, "http_error", message)

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled request failure for %s", request.url.path, exc_info=exc)
        return error_response(500, "internal_error", "Something went wrong. Please try again.")
