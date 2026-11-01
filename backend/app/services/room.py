from collections.abc import Callable
from datetime import datetime

from app.domain.clock import local_now
from app.domain.enums import RoomKind, RoomResource
from app.domain.errors import (
    RoomCapacityConflictError,
    RoomHasFutureReservationsError,
    RoomNotFoundError,
)
from app.models.room import RoomModel
from app.repositories.reservation import ReservationRepository
from app.repositories.room import RoomRepository
from app.schemas.room import Room, RoomCreate, RoomUpdate


class RoomService:
    def __init__(
        self,
        repository: RoomRepository,
        reservations: ReservationRepository,
        now: Callable[[], datetime] = local_now,
    ) -> None:
        self.repository = repository
        self.reservations = reservations
        self.now = now

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
        room = self.repository.get(room_id)
        if room is None:
            raise RoomNotFoundError(room_id)
        return Room.model_validate(room)

    def create_room(self, data: RoomCreate) -> Room:
        return Room.model_validate(self.repository.create(data.model_dump(mode="json")))

    def replace_room(self, room_id: int, data: RoomUpdate) -> Room:
        room = self._lock(room_id)
        required = self.reservations.max_future_attendees(room.id, self.now())
        if data.capacity < required:
            raise RoomCapacityConflictError(required)
        return Room.model_validate(self.repository.update(room, data.model_dump(mode="json")))

    def delete_room(self, room_id: int) -> None:
        room = self._lock(room_id)
        if self.reservations.has_future_active(room.id, self.now()):
            raise RoomHasFutureReservationsError
        self.repository.delete(room)

    def _lock(self, room_id: int) -> RoomModel:
        room = self.repository.get_for_update(room_id)
        if room is None:
            raise RoomNotFoundError(room_id)
        return room
