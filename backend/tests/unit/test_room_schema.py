import pytest
from pydantic import ValidationError

from app.domain.enums import RoomKind, RoomResource
from app.schemas.room import MAX_CAPACITY, RoomCreate


def build_room(**overrides) -> dict:
    return {
        "name": "Laboratório 3",
        "kind": "laboratory",
        "location": "Prédio 2",
        "capacity": 30,
        **overrides,
    }


def test_accepts_a_valid_room() -> None:
    room = RoomCreate(**build_room(resources=["projector"]))

    assert room.kind is RoomKind.LABORATORY
    assert room.resources == [RoomResource.PROJECTOR]


def test_resources_default_to_an_empty_list() -> None:
    assert RoomCreate(**build_room()).resources == []


def test_strips_whitespace_from_the_name() -> None:
    assert RoomCreate(**build_room(name="  Sala 1  ")).name == "Sala 1"


def test_removes_duplicated_resources_keeping_the_order() -> None:
    room = RoomCreate(**build_room(resources=["whiteboard", "projector", "whiteboard"]))

    assert room.resources == [RoomResource.WHITEBOARD, RoomResource.PROJECTOR]


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": "   "},
        {"name": "x" * 101},
        {"location": ""},
        {"kind": "garage"},
        {"capacity": 0},
        {"capacity": MAX_CAPACITY + 1},
        {"resources": ["teleporter"]},
    ],
)
def test_rejects_invalid_data(overrides: dict) -> None:
    with pytest.raises(ValidationError):
        RoomCreate(**build_room(**overrides))
