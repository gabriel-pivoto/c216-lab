from pydantic import BaseModel, ConfigDict, Field

MIN_YEAR = 1450
MAX_YEAR = 2100


class BookBase(BaseModel):
    title: str = Field(min_length=1, max_length=200, examples=["Dom Casmurro"])
    author: str = Field(min_length=1, max_length=100, examples=["Machado de Assis"])
    year: int = Field(ge=MIN_YEAR, le=MAX_YEAR, examples=[1899])
    pages: int = Field(gt=0, examples=[256])
    genre: str = Field(min_length=1, max_length=50, examples=["Romance"])
    price: float = Field(gt=0, examples=[39.9])


class BookCreate(BookBase):
    """Data to register a book (POST)."""


class BookUpdate(BookBase):
    """Full replacement of a book (PUT): every field is required."""


class BookPatch(BaseModel):
    """Partial update of a book (PATCH): only the fields sent are changed."""

    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    author: str | None = Field(default=None, min_length=1, max_length=100)
    year: int | None = Field(default=None, ge=MIN_YEAR, le=MAX_YEAR)
    pages: int | None = Field(default=None, gt=0)
    genre: str | None = Field(default=None, min_length=1, max_length=50)
    price: float | None = Field(default=None, gt=0)


class Book(BookBase):
    id: int = Field(gt=0, examples=[1])
