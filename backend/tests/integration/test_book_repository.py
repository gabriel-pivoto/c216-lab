import pytest
from sqlalchemy.orm import Session, sessionmaker

from app.models.book import BookModel
from app.repositories.book import BookRepository


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
def repository(db_session: Session) -> BookRepository:
    return BookRepository(db_session)


def test_create_stores_the_book_and_generates_an_id(
    repository: BookRepository, data: dict, database: sessionmaker[Session]
) -> None:
    book = repository.create(data)

    assert book.id == 1
    with database() as other_session:
        stored = other_session.get(BookModel, book.id)
    assert stored is not None
    assert stored.title == "Vidas Secas"


def test_get_missing_book_returns_none(repository: BookRepository) -> None:
    assert repository.get(42) is None


def test_list_all_filters_author_and_applies_limit(repository: BookRepository, data: dict) -> None:
    for author, title in [
        ("Graciliano Ramos", "Vidas Secas"),
        ("Jorge Amado", "Capitaes da Areia"),
        ("graciliano ramos", "Sao Bernardo"),
        ("GRACILIANO RAMOS", "Angustia"),
    ]:
        repository.create({**data, "author": author, "title": title})

    books = repository.list_all(author="Graciliano Ramos", limit=2)

    assert [book.title for book in books] == ["Vidas Secas", "Sao Bernardo"]


def test_update_changes_the_given_fields(
    repository: BookRepository, data: dict, database: sessionmaker[Session]
) -> None:
    book = repository.create(data)

    repository.update(book, {"genre": "Classic"})

    with database() as other_session:
        stored = other_session.get(BookModel, book.id)
    assert stored is not None
    assert (stored.genre, stored.title) == ("Classic", "Vidas Secas")


def test_delete_removes_the_row(repository: BookRepository, data: dict) -> None:
    book = repository.create(data)

    repository.delete(book)

    assert repository.get(book.id) is None
    assert repository.list_all() == []
