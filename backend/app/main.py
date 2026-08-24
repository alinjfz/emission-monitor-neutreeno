"""Application factory and production SPA fallback.

Keeping construction in ``create_app`` lets tests create an isolated FastAPI
instance while production can still import the module-level ``app`` object.
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from app.api.routes import auth, debug, health, submissions
from app.core.config import get_settings
from app.core.errors import install_error_handlers


def create_app() -> FastAPI:
    """Build the API, install shared handlers, and optionally serve the React build."""
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        description="Internal product-footprint review API.",
        version="1.0.0",
    )
    install_error_handlers(application)
    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(debug.router)
    application.include_router(submissions.router)

    frontend_dist = settings.frontend_dist.resolve()
    index_file = frontend_dist / "index.html"
    # Development uses Vite, so the fallback is registered only when a compiled
    # frontend exists (the single-container production-style deployment).
    if index_file.is_file():

        @application.get("/{full_path:path}", include_in_schema=False)
        def serve_spa(full_path: str) -> FileResponse:
            """Serve a compiled asset or fall back to the SPA entry document."""
            # API typos must stay JSON 404s rather than falling through to React.
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404, detail="Endpoint not found.")
            requested_file = (frontend_dist / full_path).resolve()
            # The parent check prevents paths such as ../../secret from escaping dist.
            if requested_file.is_file() and frontend_dist in requested_file.parents:
                return FileResponse(requested_file)
            # Client-side routes all receive index.html and are resolved by React Router.
            return FileResponse(index_file)

    return application


app = create_app()
