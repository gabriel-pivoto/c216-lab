import pytest
from fastapi.testclient import TestClient

from app.services.book import NEW_BOOK_ID, SAMPLE_BOOKS

BOOK_FIELDS = {"id", "title", "author", "year", "pages", "genre", "price"}


# GET /books


def test_list_books_returns_list(client: TestClient) -> None:
    response = client.get("/books")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == len(SAMPLE_BOOKS)
    assert all(set(book) == BOOK_FIELDS for book in body)


@pytest.mark.parametrize("author", ["Machado de Assis", "machado de assis", "MACHADO DE ASSIS"])
def test_list_books_filters_by_author_query(client: TestClient, author: str) -> None:
    response = client.get("/books", params={"author": author})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert {book["author"] for book in body} == {"Machado de Assis"}


def test_list_books_unknown_author_returns_empty_list(client: TestClient) -> None:
    response = client.get("/books", params={"author": "Clarice Lispector"})

    assert response.status_code == 200
    assert response.json() == []


def test_list_books_respects_limit_query(client: TestClient) -> None:
    response = client.get("/books", params={"limit": 2})

    assert response.status_code == 200
    assert [book["id"] for book in response.json()] == [1, 2]


@pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 101}, {"limit": "abc"}, {"author": ""}])
def test_list_books_rejects_invalid_query(client: TestClient, params: dict) -> None:
    response = client.get("/books", params=params)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][0] == "query"


# GET /books/{book_id}


@pytest.mark.parametrize("book_id", [1, 7, 999])
def test_get_book_uses_path_id(client: TestClient, book_id: int) -> None:
    response = client.get(f"/books/{book_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == book_id
    assert set(body) == BOOK_FIELDS


@pytest.mark.parametrize("book_id", ["0", "-1", "abc"])
def test_get_book_rejects_invalid_id(client: TestClient, book_id: str) -> None:
    response = client.get(f"/books/{book_id}")

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path", "book_id"]


# POST /books


def test_create_book_returns_201(client: TestClient, book_payload: dict) -> None:
    response = client.post("/books", json=book_payload)

    assert response.status_code == 201
    assert response.json() == {"id": NEW_BOOK_ID, **book_payload}


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


# PUT /books/{book_id}


def test_replace_book_returns_sent_data(client: TestClient, book_payload: dict) -> None:
    response = client.put("/books/5", json=book_payload)

    assert response.status_code == 200
    assert response.json() == {"id": 5, **book_payload}


def test_replace_book_requires_full_body(client: TestClient) -> None:
    response = client.put("/books/5", json={"price": 10.0})

    assert response.status_code == 422


def test_replace_book_rejects_invalid_id(client: TestClient, book_payload: dict) -> None:
    response = client.put("/books/0", json=book_payload)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path", "book_id"]


# PATCH /books/{book_id}


def test_update_book_changes_only_sent_fields(client: TestClient) -> None:
    original = client.get("/books/3").json()

    response = client.patch("/books/3", json={"genre": "Classic", "price": 25.0})

    assert response.status_code == 200
    assert response.json() == {**original, "genre": "Classic", "price": 25.0}


def test_update_book_with_empty_body_changes_nothing(client: TestClient) -> None:
    original = client.get("/books/3").json()

    response = client.patch("/books/3", json={})

    assert response.status_code == 200
    assert response.json() == original


@pytest.mark.parametrize(
    "body", [{"year": 1000}, {"pages": 0}, {"title": ""}, {"unknown_field": 1}]
)
def test_update_book_validates_fields(client: TestClient, body: dict) -> None:
    response = client.patch("/books/3", json=body)

    assert response.status_code == 422


def test_update_book_rejects_invalid_id(client: TestClient) -> None:
    response = client.patch("/books/-1", json={"price": 10.0})

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path", "book_id"]


# DELETE /books/{book_id}


def test_delete_book_returns_204_without_body(client: TestClient) -> None:
    response = client.delete("/books/1")

    assert response.status_code == 204
    assert response.content == b""


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
