from datetime import datetime
from typing import Any

from sqlalchemy import Select, exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.enums import ACTIVE_STATUSES
from app.domain.errors import RoomNameConflictError
from app.models.reservation import ReservationModel
from app.models.room import ROOM_NAME_CONSTRAINT, RoomModel


def _filtered(
    query: Select,
    kind: str | None,
    min_capacity: int | None,
    resources: list[str] | None,
) -> Select:
    if kind is not None:
        query = query.where(RoomModel.kind == kind)
    if min_capacity is not None:
        query = query.where(RoomModel.capacity >= min_capacity)
    if resources:
        query = query.where(RoomModel.resources.contains(resources))
    return query


class RoomRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(
        self,
        kind: str | None = None,
        min_capacity: int | None = None,
        resources: list[str] | None = None,
    ) -> list[RoomModel]:
        query = _filtered(select(RoomModel), kind, min_capacity, resources)
        return list(self.session.scalars(query.order_by(RoomModel.name)))

    def list_available(
        self,
        starts_at: datetime,
        ends_at: datetime,
        kind: str | None = None,
        min_capacity: int | None = None,
        resources: list[str] | None = None,
    ) -> list[RoomModel]:
        occupied = exists().where(
            ReservationModel.room_id == RoomModel.id,
            ReservationModel.status.in_([status.value for status in ACTIVE_STATUSES]),
            ReservationModel.starts_at < ends_at,
            ReservationModel.ends_at > starts_at,
        )
        query = _filtered(select(RoomModel), kind, min_capacity, resources).where(~occupied)
        return list(self.session.scalars(query.order_by(RoomModel.capacity, RoomModel.name)))

    def get(self, room_id: int) -> RoomModel | None:
        return self.session.get(RoomModel, room_id)

    def get_for_update(self, room_id: int) -> RoomModel | None:
        return self.session.scalar(
            select(RoomModel).where(RoomModel.id == room_id).with_for_update()
        )

    def create(self, data: dict[str, Any]) -> RoomModel:
        room = RoomModel(**data)
        self.session.add(room)
        self._commit(data["name"])
        self.session.refresh(room)
        return room

    def update(self, room: RoomModel, data: dict[str, Any]) -> RoomModel:
        for field, value in data.items():
            setattr(room, field, value)
        self._commit(data["name"])
        self.session.refresh(room)
        return room

    def delete(self, room: RoomModel) -> None:
        self.session.delete(room)
        self.session.commit()

    def _commit(self, name: str) -> None:
        try:
            self.session.commit()
        except IntegrityError as error:
            self.session.rollback()
            if error.orig.diag.constraint_name == ROOM_NAME_CONSTRAINT:
                raise RoomNameConflictError(name) from error
            raise
