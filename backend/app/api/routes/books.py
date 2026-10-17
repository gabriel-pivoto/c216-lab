from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.book import BookRepository
from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate
from app.services.book import BookNotFoundError, BookService


def get_book_service(db: Annotated[Session, Depends(get_db)]) -> BookService:
    return BookService(BookRepository(db))


def _not_found(error: BookNotFoundError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


router = APIRouter(
    prefix="/books",
    tags=["books"],
    responses={status.HTTP_404_NOT_FOUND: {"description": "Book not found"}},
)

BookId = Annotated[int, Path(gt=0, description="Book identifier")]
Service = Annotated[BookService, Depends(get_book_service)]


@router.get("", response_model=list[Book])
def list_books(
    service: Service,
    author: Annotated[str | None, Query(min_length=1, description="Filter by author")] = None,
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum number of books")] = 10,
) -> list[Book]:
    return service.list_books(author=author, limit=limit)


@router.get("/{book_id}", response_model=Book)
def get_book(book_id: BookId, service: Service) -> Book:
    try:
        return service.get_book(book_id)
    except BookNotFoundError as error:
        raise _not_found(error) from error


@router.post("", response_model=Book, status_code=status.HTTP_201_CREATED)
def create_book(data: BookCreate, service: Service) -> Book:
    return service.create_book(data)


@router.put("/{book_id}", response_model=Book)
def replace_book(book_id: BookId, data: BookUpdate, service: Service) -> Book:
    try:
        return service.replace_book(book_id, data)
    except BookNotFoundError as error:
        raise _not_found(error) from error


@router.patch("/{book_id}", response_model=Book)
def update_book(book_id: BookId, data: BookPatch, service: Service) -> Book:
    try:
        return service.update_book(book_id, data)
    except BookNotFoundError as error:
        raise _not_found(error) from error


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: BookId, service: Service) -> None:
    try:
        service.delete_book(book_id)
    except BookNotFoundError as error:
        raise _not_found(error) from error
