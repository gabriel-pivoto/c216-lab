from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import app


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
