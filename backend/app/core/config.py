from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Emissions Monitor"
    database_url: str = "sqlite:///./data/emissions.db"
    cookie_name: str = "emissions_session"
    cookie_secure: bool = False
    enable_database_reseed: bool = False
    session_days: int = 7
    allowed_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000"
    )
    frontend_dist: Path = Path("../frontend/dist")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origin_set(self) -> set[str]:
        return {
            origin.strip().rstrip("/")
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
