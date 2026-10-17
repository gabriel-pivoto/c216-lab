from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, inspect


def test_migrations_create_the_books_table(test_engine: Engine) -> None:
    columns = {column["name"] for column in inspect(test_engine).get_columns("books")}

    assert columns == {"id", "title", "author", "year", "pages", "genre", "price"}


def test_orm_models_are_in_sync_with_the_migrations(
    test_engine: Engine, alembic_config: Config
) -> None:
    command.check(alembic_config)
