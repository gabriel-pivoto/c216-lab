import pytest
from sqlalchemy.orm import Session

from app.domain.errors import RoomNameConflictError
from app.repositories.room import RoomRepository


def build_room(name: str, **overrides) -> dict:
    return {
        "name": name,
        "kind": "classroom",
        "location": "Prédio 1",
        "capacity": 40,
        "resources": [],
        **overrides,
    }


@pytest.fixture
def repository(db_session: Session) -> RoomRepository:
    return RoomRepository(db_session)


def test_create_persists_the_room(repository: RoomRepository) -> None:
    room = repository.create(build_room("Sala 1", resources=["whiteboard"]))

    assert room.id == 1
    assert repository.get(room.id).resources == ["whiteboard"]


def test_list_all_orders_by_name(repository: RoomRepository) -> None:
    repository.create(build_room("Sala B"))
    repository.create(build_room("Sala A"))

    assert [room.name for room in repository.list_all()] == ["Sala A", "Sala B"]


def test_list_all_applies_the_kind_and_capacity_filters(repository: RoomRepository) -> None:
    repository.create(build_room("Sala pequena", capacity=10))
    repository.create(build_room("Sala grande", capacity=60))
    repository.create(build_room("Lab grande", kind="laboratory", capacity=60))

    rooms = repository.list_all(kind="classroom", min_capacity=30)

    assert [room.name for room in rooms] == ["Sala grande"]


def test_list_all_requires_every_requested_resource(repository: RoomRepository) -> None:
    repository.create(build_room("Só projetor", resources=["projector"]))
    repository.create(build_room("Completa", resources=["projector", "computers"]))

    rooms = repository.list_all(resources=["projector", "computers"])

    assert [room.name for room in rooms] == ["Completa"]


def test_create_rejects_a_duplicated_name(repository: RoomRepository) -> None:
    repository.create(build_room("Sala 1"))

    with pytest.raises(RoomNameConflictError):
        repository.create(build_room("Sala 1"))

    assert len(repository.list_all()) == 1


def test_update_rejects_a_name_used_by_another_room(repository: RoomRepository) -> None:
    repository.create(build_room("Sala 1"))
    other = repository.create(build_room("Sala 2"))

    with pytest.raises(RoomNameConflictError):
        repository.update(other, build_room("Sala 1"))

    assert repository.get(other.id).name == "Sala 2"


def test_delete_removes_the_room(repository: RoomRepository) -> None:
    room = repository.create(build_room("Sala 1"))

    repository.delete(room)

    assert repository.get(room.id) is None
