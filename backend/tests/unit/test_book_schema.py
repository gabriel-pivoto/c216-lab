import pytest
from pydantic import ValidationError

from app.schemas.book import MAX_YEAR, MIN_YEAR, Book, BookCreate, BookPatch


@pytest.fixture
def valid_data() -> dict:
    return {
        "title": "Vidas Secas",
        "author": "Graciliano Ramos",
        "year": 1938,
        "pages": 176,
        "genre": "Romance",
        "price": 29.9,
    }


def test_book_create_accepts_valid_data(valid_data: dict) -> None:
    book = BookCreate(**valid_data)

    assert book.model_dump() == valid_data


@pytest.mark.parametrize("year", [MIN_YEAR, MAX_YEAR])
def test_book_create_accepts_year_bounds(valid_data: dict, year: int) -> None:
    assert BookCreate(**{**valid_data, "year": year}).year == year


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("year", MIN_YEAR - 1),
        ("year", MAX_YEAR + 1),
        ("pages", 0),
        ("price", 0),
        ("price", -1),
        ("title", ""),
        ("author", "x" * 101),
        ("genre", ""),
    ],
)
def test_book_create_rejects_invalid_values(valid_data: dict, field: str, value: object) -> None:
    with pytest.raises(ValidationError) as excinfo:
        BookCreate(**{**valid_data, field: value})

    assert excinfo.value.errors()[0]["loc"] == (field,)


def test_book_requires_positive_id(valid_data: dict) -> None:
    with pytest.raises(ValidationError):
        Book(id=0, **valid_data)


def test_book_patch_allows_empty_body() -> None:
    assert BookPatch().model_dump(exclude_unset=True) == {}


def test_book_patch_validates_sent_fields() -> None:
    with pytest.raises(ValidationError):
        BookPatch(pages=-5)


def test_book_patch_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        BookPatch(isbn="978-8535914849")
