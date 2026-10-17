import os
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, make_url, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, sessionmaker

from app.database.session import get_db
from app.main import app

BACKEND_DIR = Path(__file__).resolve().parents[2]

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://c216:c216@localhost:5432/c216_test",
)


def _create_database_if_missing(url: str) -> None:
    database_url = make_url(url)
    server = create_engine(
        database_url.set(database="postgres"),
        isolation_level="AUTOCOMMIT",
        connect_args={"connect_timeout": 5},
    )
    try:
        with server.connect() as connection:
            exists = connection.scalar(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": database_url.database},
            )
            if not exists:
                connection.execute(text(f'CREATE DATABASE "{database_url.database}"'))
    finally:
        server.dispose()


@pytest.fixture(scope="session")
def alembic_config() -> Config:
    config = Config(BACKEND_DIR / "alembic.ini")
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", TEST_DATABASE_URL.replace("%", "%%"))
    return config


@pytest.fixture(scope="session")
def test_engine(alembic_config: Config) -> Iterator[Engine]:
    try:
        _create_database_if_missing(TEST_DATABASE_URL)
        command.upgrade(alembic_config, "head")
    except OperationalError as error:
        pytest.fail(
            "Could not connect to the test PostgreSQL "
            f"({make_url(TEST_DATABASE_URL).render_as_string(hide_password=True)}). "
            "Start the database with `make up` before running the integration tests.\n"
            f"{error}"
        )

    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    yield engine
    engine.dispose()


@pytest.fixture
def database(test_engine: Engine) -> Iterator[sessionmaker[Session]]:
    with test_engine.begin() as connection:
        connection.execute(text("TRUNCATE TABLE books RESTART IDENTITY"))

    factory = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)

    def _get_test_db() -> Iterator[Session]:
        with factory() as session:
            yield session

    app.dependency_overrides[get_db] = _get_test_db
    yield factory
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def db_session(database: sessionmaker[Session]) -> Iterator[Session]:
    with database() as session:
        yield session


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def book_payload() -> dict:
    return {
        "title": "Grande Sertao: Veredas",
        "author": "Joao Guimaraes Rosa",
        "year": 1956,
        "pages": 624,
        "genre": "Romance",
        "price": 79.9,
    }
