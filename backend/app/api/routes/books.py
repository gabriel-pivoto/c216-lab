from typing import Annotated

from fastapi import APIRouter, Path, Query, status

from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate
from app.services import book as book_service

router = APIRouter(prefix="/books", tags=["books"])

BookId = Annotated[int, Path(gt=0, description="Book identifier")]


@router.get("", response_model=list[Book])
def list_books(
    author: Annotated[str | None, Query(min_length=1, description="Filter by author")] = None,
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum number of books")] = 10,
) -> list[Book]:
    return book_service.list_books(author=author, limit=limit)


@router.get("/{book_id}", response_model=Book)
def get_book(book_id: BookId) -> Book:
    return book_service.get_book(book_id)


@router.post("", response_model=Book, status_code=status.HTTP_201_CREATED)
def create_book(data: BookCreate) -> Book:
    return book_service.create_book(data)


@router.put("/{book_id}", response_model=Book)
def replace_book(book_id: BookId, data: BookUpdate) -> Book:
    return book_service.replace_book(book_id, data)


@router.patch("/{book_id}", response_model=Book)
def update_book(book_id: BookId, data: BookPatch) -> Book:
    return book_service.update_book(book_id, data)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: BookId) -> None:
    book_service.delete_book(book_id)
