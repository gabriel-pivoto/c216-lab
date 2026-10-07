import pytest

from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate
from app.services import book as book_service


@pytest.fixture
def data() -> dict:
    return {
        "title": "Vidas Secas",
        "author": "Graciliano Ramos",
        "year": 1938,
        "pages": 176,
        "genre": "Romance",
        "price": 29.9,
    }


def test_list_books_without_filter_returns_all() -> None:
    assert book_service.list_books() == list(book_service.SAMPLE_BOOKS)


def test_list_books_filters_author_case_insensitively() -> None:
    books = book_service.list_books(author="george orwell")

    assert [book.title for book in books] == ["1984"]


@pytest.mark.parametrize("limit", [1, 2, 3])
def test_list_books_applies_limit(limit: int) -> None:
    assert len(book_service.list_books(limit=limit)) == limit


def test_get_book_returns_book_with_given_id() -> None:
    book = book_service.get_book(42)

    assert isinstance(book, Book)
    assert book.id == 42


def test_create_book_assigns_new_id(data: dict) -> None:
    book = book_service.create_book(BookCreate(**data))

    assert book == Book(id=book_service.NEW_BOOK_ID, **data)


def test_new_book_id_does_not_clash_with_samples() -> None:
    assert book_service.NEW_BOOK_ID not in {book.id for book in book_service.SAMPLE_BOOKS}


def test_replace_book_uses_all_data(data: dict) -> None:
    book = book_service.replace_book(8, BookUpdate(**data))

    assert book == Book(id=8, **data)


def test_update_book_changes_only_sent_fields() -> None:
    original = book_service.get_book(2)

    book = book_service.update_book(2, BookPatch(price=19.9))

    assert book == original.model_copy(update={"price": 19.9})


def test_update_book_ignores_null_fields() -> None:
    original = book_service.get_book(2)

    assert book_service.update_book(2, BookPatch(price=None)) == original


def test_delete_book_returns_nothing() -> None:
    assert book_service.delete_book(1) is None
