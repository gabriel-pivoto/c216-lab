from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, inspect


def test_migrations_create_the_rooms_table(test_engine: Engine) -> None:
    columns = {column["name"] for column in inspect(test_engine).get_columns("rooms")}

    assert columns == {"id", "name", "kind", "location", "capacity", "resources"}


def test_migrations_create_the_reservations_table(test_engine: Engine) -> None:
    columns = {column["name"] for column in inspect(test_engine).get_columns("reservations")}

    assert columns == {
        "id",
        "room_id",
        "title",
        "requester_name",
        "requester_email",
        "attendees",
        "starts_at",
        "ends_at",
        "status",
        "series_id",
        "created_at",
    }


def test_orm_models_are_in_sync_with_the_migrations(
    test_engine: Engine, alembic_config: Config
) -> None:
    command.check(alembic_config)
