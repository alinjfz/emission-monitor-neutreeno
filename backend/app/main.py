from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from app.api.routes import auth, debug, health, submissions
from app.core.config import get_settings
from app.core.errors import install_error_handlers


def create_app() -> FastAPI:
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
    if index_file.is_file():

        @application.get("/{full_path:path}", include_in_schema=False)
        def serve_spa(full_path: str) -> FileResponse:
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404, detail="Endpoint not found.")
            requested_file = (frontend_dist / full_path).resolve()
            if requested_file.is_file() and frontend_dist in requested_file.parents:
                return FileResponse(requested_file)
            return FileResponse(index_file)

    return application


app = create_app()
