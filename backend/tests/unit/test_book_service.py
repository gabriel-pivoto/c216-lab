from typing import Any

import pytest

from app.models.book import BookModel
from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate
from app.services.book import BookNotFoundError, BookService


class FakeBookRepository:
    def __init__(self) -> None:
        self.books: dict[int, BookModel] = {}
        self.next_id = 1

    def list_all(self, author: str | None = None, limit: int = 10) -> list[BookModel]:
        books = sorted(self.books.values(), key=lambda book: book.id)
        if author is not None:
            books = [book for book in books if book.author.lower() == author.lower()]
        return books[:limit]

    def get(self, book_id: int) -> BookModel | None:
        return self.books.get(book_id)

    def create(self, data: dict[str, Any]) -> BookModel:
        book = BookModel(id=self.next_id, **data)
        self.books[book.id] = book
        self.next_id += 1
        return book

    def update(self, book: BookModel, data: dict[str, Any]) -> BookModel:
        for field, value in data.items():
            setattr(book, field, value)
        return book

    def delete(self, book: BookModel) -> None:
        del self.books[book.id]


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


@pytest.fixture
def repository() -> FakeBookRepository:
    repo = FakeBookRepository()
    for book in BOOKS:
        repo.create(book)
    return repo


@pytest.fixture
def service(repository: FakeBookRepository) -> BookService:
    return BookService(repository)


def test_list_books_without_filter_returns_all(service: BookService) -> None:
    books = service.list_books()

    assert books == [Book(id=i, **data) for i, data in enumerate(BOOKS, start=1)]


def test_list_books_filters_author_case_insensitively(service: BookService) -> None:
    books = service.list_books(author="machado de assis")

    assert [book.title for book in books] == ["Dom Casmurro", "Memorias Postumas de Bras Cubas"]


@pytest.mark.parametrize("limit", [1, 2, 3])
def test_list_books_applies_limit(service: BookService, limit: int) -> None:
    assert len(service.list_books(limit=limit)) == limit


def test_get_book_returns_pydantic_schema(service: BookService) -> None:
    book = service.get_book(2)

    assert isinstance(book, Book)
    assert book == Book(id=2, **BOOKS[1])


def test_get_missing_book_raises_error(service: BookService) -> None:
    with pytest.raises(BookNotFoundError, match="Book 42 not found"):
        service.get_book(42)


def test_create_book_stores_it_in_the_repository(
    service: BookService, repository: FakeBookRepository, data: dict
) -> None:
    book = service.create_book(BookCreate(**data))

    assert book == Book(id=4, **data)
    assert repository.get(4) is not None


def test_replace_book_uses_all_data(service: BookService, data: dict) -> None:
    book = service.replace_book(1, BookUpdate(**data))

    assert book == Book(id=1, **data)
    assert service.get_book(1) == book


def test_replace_missing_book_raises_error(service: BookService, data: dict) -> None:
    with pytest.raises(BookNotFoundError):
        service.replace_book(42, BookUpdate(**data))


def test_update_book_changes_only_sent_fields(service: BookService) -> None:
    original = service.get_book(2)

    book = service.update_book(2, BookPatch(price=19.9))

    assert book == original.model_copy(update={"price": 19.9})


def test_update_book_ignores_null_fields(service: BookService) -> None:
    original = service.get_book(2)

    assert service.update_book(2, BookPatch(price=None)) == original


def test_update_missing_book_raises_error(service: BookService) -> None:
    with pytest.raises(BookNotFoundError):
        service.update_book(42, BookPatch(price=10.0))


def test_delete_book_removes_it_from_the_repository(
    service: BookService, repository: FakeBookRepository
) -> None:
    assert service.delete_book(1) is None
    assert repository.get(1) is None


def test_delete_missing_book_raises_error(service: BookService) -> None:
    with pytest.raises(BookNotFoundError):
        service.delete_book(42)
