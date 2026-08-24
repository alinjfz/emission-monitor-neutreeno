from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.base import Base
from app.db.seed import seed_database
from app.db.session import build_engine, get_db
from app.main import create_app


@pytest.fixture
def clients(tmp_path) -> Generator[tuple[TestClient, TestClient], None, None]:
    engine = build_engine(f"sqlite:///{tmp_path / 'test.db'}")
    testing_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(engine)
    with testing_session() as db:
        seed_database(db)

    def override_db() -> Generator[Session, None, None]:
        with testing_session() as db:
            yield db

    app = create_app()
    app.dependency_overrides[get_db] = override_db
    test_settings = get_settings().model_copy(update={"enable_database_reseed": True})
    app.dependency_overrides[get_settings] = lambda: test_settings
    headers = {"Origin": "http://localhost:8000"}
    with (
        TestClient(app, base_url="http://localhost:8000", headers=headers) as first,
        TestClient(app, base_url="http://localhost:8000", headers=headers) as second,
    ):
        yield first, second

    Base.metadata.drop_all(engine)
    engine.dispose()
