from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.models.book import BookModel

BOOK_FIELDS = {"id", "title", "author", "year", "pages", "genre", "price"}

BOOKS = (
    {
        "title": "Dom Casmurro",
        "author": "Machado de Assis",
        "year": 1899,
        "pages": 256,
        "genre": "Romance",
        "price": 39.9,
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "year": 1949,
        "pages": 328,
        "genre": "Dystopia",
        "price": 49.9,
    },
    {
        "title": "Memorias Postumas de Bras Cubas",
        "author": "Machado de Assis",
        "year": 1881,
        "pages": 208,
        "genre": "Romance",
        "price": 34.9,
    },
)

pytestmark = pytest.mark.usefixtures("database")


@pytest.fixture
def register(client: TestClient) -> Callable[[dict], dict]:
    def _register(data: dict) -> dict:
        response = client.post("/books", json=data)
        assert response.status_code == 201
        return response.json()

    return _register


@pytest.fixture
def books(register: Callable[[dict], dict]) -> list[dict]:
    return [register(data) for data in BOOKS]


# GET /books


def test_list_books_without_records_returns_empty_list(client: TestClient) -> None:
    response = client.get("/books")

    assert response.status_code == 200
    assert response.json() == []


def test_list_books_returns_records_ordered_by_id(client: TestClient, books: list[dict]) -> None:
    response = client.get("/books")

    assert response.status_code == 200
    assert response.json() == books
    assert all(set(book) == BOOK_FIELDS for book in response.json())


@pytest.mark.parametrize("author", ["Machado de Assis", "machado de assis", "MACHADO DE ASSIS"])
def test_list_books_filters_by_author_query(
    client: TestClient, books: list[dict], author: str
) -> None:
    response = client.get("/books", params={"author": author})

    assert response.status_code == 200
    assert [book["title"] for book in response.json()] == [
        "Dom Casmurro",
        "Memorias Postumas de Bras Cubas",
    ]


def test_list_books_unknown_author_returns_empty_list(
    client: TestClient, books: list[dict]
) -> None:
    response = client.get("/books", params={"author": "Clarice Lispector"})

    assert response.status_code == 200
    assert response.json() == []


def test_list_books_respects_limit_query(client: TestClient, books: list[dict]) -> None:
    response = client.get("/books", params={"limit": 2})

    assert response.status_code == 200
    assert response.json() == books[:2]


@pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 101}, {"limit": "abc"}, {"author": ""}])
def test_list_books_rejects_invalid_query(client: TestClient, params: dict) -> None:
    response = client.get("/books", params=params)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][0] == "query"


# GET /books/{book_id}


def test_get_book_returns_the_stored_book(client: TestClient, books: list[dict]) -> None:
    target = books[1]

    response = client.get(f"/books/{target['id']}")

    assert response.status_code == 200
    assert response.json() == target


def test_get_missing_book_returns_404(client: TestClient) -> None:
    response = client.get("/books/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Book 999 not found"}


@pytest.mark.parametrize("book_id", ["0", "-1", "abc"])
def test_get_book_rejects_invalid_id(client: TestClient, book_id: str) -> None:
    response = client.get(f"/books/{book_id}")

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path", "book_id"]


# POST /books


def test_create_book_returns_201_with_generated_id(client: TestClient, book_payload: dict) -> None:
    response = client.post("/books", json=book_payload)

    assert response.status_code == 201
    assert response.json() == {"id": 1, **book_payload}


def test_create_book_generates_sequential_ids(register: Callable[[dict], dict]) -> None:
    ids = [register(data)["id"] for data in BOOKS]

    assert ids == [1, 2, 3]


def test_create_book_persists_in_the_database(
    client: TestClient, book_payload: dict, db_session: Session
) -> None:
    book_payload["price"] = 99999.99

    created = client.post("/books", json=book_payload).json()

    row = db_session.get(BookModel, created["id"])
    assert row is not None
    assert (row.title, row.author, row.year, row.pages, row.genre) == (
        "Grande Sertao: Veredas",
        "Joao Guimaraes Rosa",
        1956,
        624,
        "Romance",
    )
    assert float(row.price) == 99999.99


@pytest.mark.parametrize("field", ["title", "author", "year", "pages", "genre", "price"])
def test_create_book_requires_every_field(
    client: TestClient, book_payload: dict, field: str
) -> None:
    book_payload.pop(field)

    response = client.post("/books", json=book_payload)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", field]


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("year", 1000),
        ("year", "old"),
        ("pages", 0),
        ("price", 0),
        ("price", -10),
        ("title", ""),
    ],
)
def test_create_book_validates_fields(
    client: TestClient, book_payload: dict, field: str, value: object
) -> None:
    book_payload[field] = value

    response = client.post("/books", json=book_payload)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", field]
    assert client.get("/books").json() == []


# PUT /books/{book_id}


def test_replace_book_swaps_every_field(
    client: TestClient, books: list[dict], book_payload: dict
) -> None:
    target_id = books[0]["id"]

    response = client.put(f"/books/{target_id}", json=book_payload)

    assert response.status_code == 200
    assert response.json() == {"id": target_id, **book_payload}
    assert client.get(f"/books/{target_id}").json() == {"id": target_id, **book_payload}


def test_replace_missing_book_returns_404(client: TestClient, book_payload: dict) -> None:
    response = client.put("/books/999", json=book_payload)

    assert response.status_code == 404
    assert client.get("/books").json() == []


def test_replace_book_requires_full_body(client: TestClient, books: list[dict]) -> None:
    response = client.put(f"/books/{books[0]['id']}", json={"price": 10.0})

    assert response.status_code == 422


def test_replace_book_rejects_invalid_id(client: TestClient, book_payload: dict) -> None:
    response = client.put("/books/0", json=book_payload)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path", "book_id"]


# PATCH /books/{book_id}


def test_update_book_changes_only_sent_fields(client: TestClient, books: list[dict]) -> None:
    original = books[2]

    response = client.patch(f"/books/{original['id']}", json={"genre": "Classic", "price": 25.0})

    expected = {**original, "genre": "Classic", "price": 25.0}
    assert response.status_code == 200
    assert response.json() == expected
    assert client.get(f"/books/{original['id']}").json() == expected


def test_update_book_with_empty_body_changes_nothing(client: TestClient, books: list[dict]) -> None:
    original = books[2]

    response = client.patch(f"/books/{original['id']}", json={})

    assert response.status_code == 200
    assert response.json() == original


def test_update_missing_book_returns_404(client: TestClient) -> None:
    response = client.patch("/books/999", json={"price": 10.0})

    assert response.status_code == 404


@pytest.mark.parametrize(
    "body", [{"year": 1000}, {"pages": 0}, {"title": ""}, {"unknown_field": 1}]
)
def test_update_book_validates_fields(client: TestClient, books: list[dict], body: dict) -> None:
    response = client.patch(f"/books/{books[0]['id']}", json=body)

    assert response.status_code == 422
    assert client.get(f"/books/{books[0]['id']}").json() == books[0]


def test_update_book_rejects_invalid_id(client: TestClient) -> None:
    response = client.patch("/books/-1", json={"price": 10.0})

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path", "book_id"]


# DELETE /books/{book_id}


def test_delete_book_returns_204_and_removes_it_from_the_database(
    client: TestClient, books: list[dict], database: sessionmaker[Session]
) -> None:
    target_id = books[0]["id"]

    response = client.delete(f"/books/{target_id}")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/books/{target_id}").status_code == 404
    with database() as session:
        assert session.get(BookModel, target_id) is None
    assert client.get("/books").json() == books[1:]


def test_delete_missing_book_returns_404(client: TestClient) -> None:
    response = client.delete("/books/999")

    assert response.status_code == 404


def test_delete_book_rejects_invalid_id(client: TestClient) -> None:
    response = client.delete("/books/abc")

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path", "book_id"]


# Contract


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_books_collection_rejects_item_methods(client: TestClient, method: str) -> None:
    assert getattr(client, method)("/books").status_code == 405


def test_book_item_rejects_post(client: TestClient) -> None:
    assert client.post("/books/1").status_code == 405


@pytest.mark.parametrize(
    ("route", "methods"),
    [("/books", {"get", "post"}), ("/books/{book_id}", {"get", "put", "patch", "delete"})],
)
def test_book_routes_are_documented_in_openapi(
    client: TestClient, route: str, methods: set[str]
) -> None:
    schema = client.get("/openapi.json").json()

    assert set(schema["paths"][route]) == methods
    assert "Book" in schema["components"]["schemas"]
