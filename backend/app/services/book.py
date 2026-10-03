from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate

# No database yet: the service only builds and returns values.
SAMPLE_BOOKS: tuple[Book, ...] = (
    Book(id=1, title="Dom Casmurro", author="Machado de Assis", year=1899, pages=256, genre="Romance", price=39.9),
    Book(id=2, title="1984", author="George Orwell", year=1949, pages=328, genre="Dystopia", price=49.9),
    Book(id=3, title="Memorias Postumas de Bras Cubas", author="Machado de Assis", year=1881, pages=208, genre="Romance", price=34.9),
    Book(id=4, title="The Hobbit", author="J. R. R. Tolkien", year=1937, pages=310, genre="Fantasy", price=59.9),
)

NEW_BOOK_ID = len(SAMPLE_BOOKS) + 1


def list_books(author: str | None = None, limit: int = 10) -> list[Book]:
    books = SAMPLE_BOOKS
    if author is not None:
        books = tuple(book for book in books if book.author.lower() == author.lower())
    return list(books[:limit])


def get_book(book_id: int) -> Book:
    base = SAMPLE_BOOKS[0]
    return base.model_copy(update={"id": book_id})


def create_book(data: BookCreate) -> Book:
    return Book(id=NEW_BOOK_ID, **data.model_dump())


def replace_book(book_id: int, data: BookUpdate) -> Book:
    return Book(id=book_id, **data.model_dump())


def update_book(book_id: int, data: BookPatch) -> Book:
    current = get_book(book_id)
    changes = data.model_dump(exclude_unset=True, exclude_none=True)
    return current.model_copy(update=changes)


def delete_book(book_id: int) -> None:
    return None
