from app.domain.enums import RoomKind, RoomResource
from app.domain.errors import RoomNotFoundError
from app.models.room import RoomModel
from app.repositories.room import RoomRepository
from app.schemas.room import Room, RoomCreate, RoomUpdate


class RoomService:
    def __init__(self, repository: RoomRepository) -> None:
        self.repository = repository

    def list_rooms(
        self,
        kind: RoomKind | None = None,
        min_capacity: int | None = None,
        resources: list[RoomResource] | None = None,
    ) -> list[Room]:
        rooms = self.repository.list_all(
            kind=kind.value if kind else None,
            min_capacity=min_capacity,
            resources=[resource.value for resource in resources or []],
        )
        return [Room.model_validate(room) for room in rooms]

    def get_room(self, room_id: int) -> Room:
        return Room.model_validate(self._find(room_id))

    def create_room(self, data: RoomCreate) -> Room:
        return Room.model_validate(self.repository.create(data.model_dump(mode="json")))

    def replace_room(self, room_id: int, data: RoomUpdate) -> Room:
        room = self.repository.update(self._find(room_id), data.model_dump(mode="json"))
        return Room.model_validate(room)

    def delete_room(self, room_id: int) -> None:
        self.repository.delete(self._find(room_id))

    def _find(self, room_id: int) -> RoomModel:
        room = self.repository.get(room_id)
        if room is None:
            raise RoomNotFoundError(room_id)
        return room
