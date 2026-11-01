from datetime import datetime

from sqlalchemy import Row, func, select
from sqlalchemy.orm import Session

from app.domain.enums import ACTIVE_STATUSES, ReservationStatus
from app.models.reservation import ReservationModel
from app.models.room import RoomModel

ACTIVE_VALUES = [status.value for status in ACTIVE_STATUSES]

HOURS = func.extract("epoch", ReservationModel.ends_at - ReservationModel.starts_at) / 3600


class DashboardRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def count_rooms(self) -> int:
        return self.session.scalar(select(func.count()).select_from(RoomModel))

    def count_pending(self, now: datetime) -> int:
        return self._count(
            ReservationModel.status == ReservationStatus.PENDING.value,
            ReservationModel.starts_at > now,
        )

    def count_active_between(self, start: datetime, end: datetime) -> int:
        return self._count(
            ReservationModel.status.in_(ACTIVE_VALUES),
            ReservationModel.starts_at >= start,
            ReservationModel.starts_at < end,
        )

    def count_approved_between(self, start: datetime, end: datetime) -> int:
        return self._count(
            ReservationModel.status == ReservationStatus.APPROVED.value,
            ReservationModel.starts_at >= start,
            ReservationModel.starts_at < end,
        )

    def active_hours_between(self, start: datetime, end: datetime) -> float:
        query = select(func.coalesce(func.sum(HOURS), 0)).where(
            ReservationModel.status.in_(ACTIVE_VALUES),
            ReservationModel.starts_at >= start,
            ReservationModel.starts_at < end,
        )
        return float(self.session.scalar(query))

    def busiest_rooms(self, start: datetime, end: datetime, limit: int) -> list[Row]:
        reservations = func.count(ReservationModel.id)
        query = (
            select(
                RoomModel.id.label("room_id"),
                RoomModel.name.label("room_name"),
                reservations.label("reservations"),
                func.sum(HOURS).label("hours"),
            )
            .join(ReservationModel, ReservationModel.room_id == RoomModel.id)
            .where(
                ReservationModel.status == ReservationStatus.APPROVED.value,
                ReservationModel.starts_at >= start,
                ReservationModel.starts_at < end,
            )
            .group_by(RoomModel.id, RoomModel.name)
            .order_by(reservations.desc(), RoomModel.name)
            .limit(limit)
        )
        return list(self.session.execute(query))

    def _count(self, *conditions) -> int:
        query = select(func.count()).select_from(ReservationModel).where(*conditions)
        return self.session.scalar(query)
