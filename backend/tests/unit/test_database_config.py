import pytest

from app.database.config import DEFAULT_DATABASE_URL, get_database_url


def test_database_url_comes_from_the_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    url = "postgresql+psycopg://user:secret@db:5432/other_db"
    monkeypatch.setenv("DATABASE_URL", url)

    assert get_database_url() == url


def test_database_url_falls_back_to_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)

    assert get_database_url() == DEFAULT_DATABASE_URL
