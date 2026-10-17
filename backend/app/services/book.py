from app.models.book import BookModel
from app.repositories.book import BookRepository
from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate


class BookNotFoundError(LookupError):
    def __init__(self, book_id: int) -> None:
        super().__init__(f"Book {book_id} not found")
        self.book_id = book_id


class BookService:
    def __init__(self, repository: BookRepository) -> None:
        self.repository = repository

    def list_books(self, author: str | None = None, limit: int = 10) -> list[Book]:
        books = self.repository.list_all(author=author, limit=limit)
        return [Book.model_validate(book) for book in books]

    def get_book(self, book_id: int) -> Book:
        return Book.model_validate(self._find(book_id))

    def create_book(self, data: BookCreate) -> Book:
        return Book.model_validate(self.repository.create(data.model_dump()))

    def replace_book(self, book_id: int, data: BookUpdate) -> Book:
        book = self.repository.update(self._find(book_id), data.model_dump())
        return Book.model_validate(book)

    def update_book(self, book_id: int, data: BookPatch) -> Book:
        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        book = self.repository.update(self._find(book_id), changes)
        return Book.model_validate(book)

    def delete_book(self, book_id: int) -> None:
        self.repository.delete(self._find(book_id))

    def _find(self, book_id: int) -> BookModel:
        book = self.repository.get(book_id)
        if book is None:
            raise BookNotFoundError(book_id)
        return book
