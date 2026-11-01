from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.errors import RoomNameConflictError
from app.models.room import ROOM_NAME_CONSTRAINT, RoomModel


class RoomRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(
        self,
        kind: str | None = None,
        min_capacity: int | None = None,
        resources: list[str] | None = None,
    ) -> list[RoomModel]:
        query = select(RoomModel).order_by(RoomModel.name)
        if kind is not None:
            query = query.where(RoomModel.kind == kind)
        if min_capacity is not None:
            query = query.where(RoomModel.capacity >= min_capacity)
        if resources:
            query = query.where(RoomModel.resources.contains(resources))
        return list(self.session.scalars(query))

    def get(self, room_id: int) -> RoomModel | None:
        return self.session.get(RoomModel, room_id)

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
