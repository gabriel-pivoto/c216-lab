from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.book import BookModel


class BookRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self, author: str | None = None, limit: int = 10) -> list[BookModel]:
        query = select(BookModel).order_by(BookModel.id).limit(limit)
        if author is not None:
            query = query.where(func.lower(BookModel.author) == author.lower())
        return list(self.session.scalars(query))

    def get(self, book_id: int) -> BookModel | None:
        return self.session.get(BookModel, book_id)

    def create(self, data: dict[str, Any]) -> BookModel:
        book = BookModel(**data)
        self.session.add(book)
        self.session.commit()
        self.session.refresh(book)
        return book

    def update(self, book: BookModel, data: dict[str, Any]) -> BookModel:
        for field, value in data.items():
            setattr(book, field, value)
        self.session.commit()
        self.session.refresh(book)
        return book

    def delete(self, book: BookModel) -> None:
        self.session.delete(book)
        self.session.commit()
