from types import SimpleNamespace
from typing import Any

import pytest

from app.domain.enums import RoomKind, RoomResource
from app.domain.errors import RoomNotFoundError
from app.schemas.room import RoomCreate, RoomUpdate
from app.services.room import RoomService


class FakeRoomRepository:
    def __init__(self) -> None:
        self.rooms: dict[int, SimpleNamespace] = {}
        self.last_filters: dict[str, Any] = {}

    def list_all(self, **filters: Any) -> list[SimpleNamespace]:
        self.last_filters = filters
        return list(self.rooms.values())

    def get(self, room_id: int) -> SimpleNamespace | None:
        return self.rooms.get(room_id)

    def create(self, data: dict[str, Any]) -> SimpleNamespace:
        room = SimpleNamespace(id=len(self.rooms) + 1, **data)
        self.rooms[room.id] = room
        return room

    def update(self, room: SimpleNamespace, data: dict[str, Any]) -> SimpleNamespace:
        vars(room).update(data)
        return room

    def delete(self, room: SimpleNamespace) -> None:
        del self.rooms[room.id]


@pytest.fixture
def repository() -> FakeRoomRepository:
    return FakeRoomRepository()


@pytest.fixture
def service(repository: FakeRoomRepository) -> RoomService:
    return RoomService(repository)


@pytest.fixture
def room_data() -> dict:
    return {
        "name": "Auditório",
        "kind": "auditorium",
        "location": "Prédio 1",
        "capacity": 120,
        "resources": ["projector"],
    }


def test_create_room_sends_plain_values_to_the_repository(
    service: RoomService, repository: FakeRoomRepository, room_data: dict
) -> None:
    room = service.create_room(RoomCreate(**room_data))

    assert room.id == 1
    assert repository.rooms[1].kind == "auditorium"
    assert repository.rooms[1].resources == ["projector"]


def test_list_rooms_converts_the_filters_to_plain_values(
    service: RoomService, repository: FakeRoomRepository
) -> None:
    service.list_rooms(
        kind=RoomKind.LABORATORY, min_capacity=10, resources=[RoomResource.COMPUTERS]
    )

    assert repository.last_filters == {
        "kind": "laboratory",
        "min_capacity": 10,
        "resources": ["computers"],
    }


def test_replace_room_changes_the_stored_room(service: RoomService, room_data: dict) -> None:
    created = service.create_room(RoomCreate(**room_data))

    updated = service.replace_room(created.id, RoomUpdate(**{**room_data, "capacity": 80}))

    assert updated.capacity == 80
    assert service.get_room(created.id).capacity == 80


def test_delete_room_removes_it(service: RoomService, room_data: dict) -> None:
    created = service.create_room(RoomCreate(**room_data))

    service.delete_room(created.id)

    with pytest.raises(RoomNotFoundError):
        service.get_room(created.id)


@pytest.mark.parametrize(
    "action",
    [
        lambda service, data: service.get_room(99),
        lambda service, data: service.replace_room(99, RoomUpdate(**data)),
        lambda service, data: service.delete_room(99),
    ],
)
def test_missing_room_raises_not_found(service: RoomService, room_data: dict, action) -> None:
    with pytest.raises(RoomNotFoundError):
        action(service, room_data)
