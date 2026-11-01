from collections.abc import Iterable
from datetime import date, datetime, time, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import exists, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.enums import ACTIVE_STATUSES
from app.domain.errors import ReservationConflictError
from app.models.reservation import RESERVATION_PERIOD_CONSTRAINT, ReservationModel

ACTIVE_VALUES = [status.value for status in ACTIVE_STATUSES]


class ReservationRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(
        self,
        room_id: int | None = None,
        statuses: list[str] | None = None,
        requester_email: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        limit: int = 200,
    ) -> list[ReservationModel]:
        query = select(ReservationModel).order_by(ReservationModel.starts_at).limit(limit)
        if room_id is not None:
            query = query.where(ReservationModel.room_id == room_id)
        if statuses:
            query = query.where(ReservationModel.status.in_(statuses))
        if requester_email is not None:
            query = query.where(ReservationModel.requester_email == requester_email.lower())
        if date_from is not None:
            query = query.where(ReservationModel.starts_at >= datetime.combine(date_from, time.min))
        if date_to is not None:
            next_day = datetime.combine(date_to + timedelta(days=1), time.min)
            query = query.where(ReservationModel.starts_at < next_day)
        return list(self.session.scalars(query))

    def get(self, reservation_id: int) -> ReservationModel | None:
        return self.session.get(ReservationModel, reservation_id)

    def get_for_update(self, reservation_id: int) -> ReservationModel | None:
        query = (
            select(ReservationModel).where(ReservationModel.id == reservation_id).with_for_update()
        )
        return self.session.scalar(query)

    def list_series_for_update(self, series_id: UUID) -> list[ReservationModel]:
        query = (
            select(ReservationModel)
            .where(ReservationModel.series_id == series_id)
            .order_by(ReservationModel.starts_at)
            .with_for_update()
        )
        return list(self.session.scalars(query))

    def find_conflicts(
        self,
        room_id: int,
        starts_at: datetime,
        ends_at: datetime,
        exclude_id: int | None = None,
    ) -> list[ReservationModel]:
        query = select(ReservationModel).where(
            ReservationModel.room_id == room_id,
            ReservationModel.status.in_(ACTIVE_VALUES),
            ReservationModel.starts_at < ends_at,
            ReservationModel.ends_at > starts_at,
        )
        if exclude_id is not None:
            query = query.where(ReservationModel.id != exclude_id)
        return list(self.session.scalars(query))

    def has_future_active(self, room_id: int, now: datetime) -> bool:
        query = select(
            exists().where(
                ReservationModel.room_id == room_id,
                ReservationModel.status.in_(ACTIVE_VALUES),
                ReservationModel.ends_at > now,
            )
        )
        return bool(self.session.scalar(query))

    def max_future_attendees(self, room_id: int, now: datetime) -> int:
        query = select(func.coalesce(func.max(ReservationModel.attendees), 0)).where(
            ReservationModel.room_id == room_id,
            ReservationModel.status.in_(ACTIVE_VALUES),
            ReservationModel.ends_at > now,
        )
        return self.session.scalar(query)

    def create(self, data: dict[str, Any]) -> ReservationModel:
        return self.create_many([data])[0]

    def create_many(self, items: Iterable[dict[str, Any]]) -> list[ReservationModel]:
        reservations = [ReservationModel(**data) for data in items]
        self.session.add_all(reservations)
        self._commit()
        for reservation in reservations:
            self.session.refresh(reservation)
        return reservations

    def update(self, reservation: ReservationModel, data: dict[str, Any]) -> ReservationModel:
        for field, value in data.items():
            setattr(reservation, field, value)
        self._commit()
        self.session.refresh(reservation)
        return reservation

    def update_status(self, reservations: list[ReservationModel], status: str) -> None:
        for reservation in reservations:
            reservation.status = status
        self._commit()

    def delete(self, reservation: ReservationModel) -> None:
        self.session.delete(reservation)
        self.session.commit()

    def _commit(self) -> None:
        try:
            self.session.commit()
        except IntegrityError as error:
            self.session.rollback()
            if error.orig.diag.constraint_name == RESERVATION_PERIOD_CONSTRAINT:
                raise ReservationConflictError from error
            raise
