from collections.abc import Callable
from datetime import date, datetime
from uuid import UUID, uuid4

from app.domain import reservation_rules as rules
from app.domain.clock import local_now
from app.domain.enums import ACTIVE_STATUSES, ReservationStatus
from app.domain.errors import (
    ReservationConflictError,
    ReservationNotFoundError,
    RoomNotFoundError,
    SeriesNotFoundError,
)
from app.models.reservation import ReservationModel
from app.models.room import RoomModel
from app.repositories.reservation import ReservationRepository
from app.repositories.room import RoomRepository
from app.schemas.reservation import (
    RecurringReservationCreate,
    Reservation,
    ReservationCreate,
    ReservationUpdate,
)


class ReservationService:
    def __init__(
        self,
        reservations: ReservationRepository,
        rooms: RoomRepository,
        now: Callable[[], datetime] = local_now,
    ) -> None:
        self.reservations = reservations
        self.rooms = rooms
        self.now = now

    def list_reservations(
        self,
        room_id: int | None = None,
        statuses: list[ReservationStatus] | None = None,
        requester_email: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        limit: int = 200,
    ) -> list[Reservation]:
        reservations = self.reservations.list_all(
            room_id=room_id,
            statuses=[status.value for status in statuses or []],
            requester_email=requester_email,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
        )
        return [Reservation.model_validate(reservation) for reservation in reservations]

    def get_reservation(self, reservation_id: int) -> Reservation:
        reservation = self.reservations.get(reservation_id)
        if reservation is None:
            raise ReservationNotFoundError(reservation_id)
        return Reservation.model_validate(reservation)

    def create_reservation(self, data: ReservationCreate) -> Reservation:
        room = self._lock_room(data.room_id)
        rules.validate_period(data.starts_at, data.ends_at, self.now())
        rules.validate_attendees(data.attendees, room.capacity)
        self._ensure_free(room.id, [(data.starts_at, data.ends_at)])
        created = self.reservations.create(
            {**data.model_dump(), "status": ReservationStatus.PENDING.value}
        )
        return Reservation.model_validate(created)

    def create_recurring(self, data: RecurringReservationCreate) -> list[Reservation]:
        room = self._lock_room(data.room_id)
        rules.validate_period(data.starts_at, data.ends_at, self.now())
        rules.validate_attendees(data.attendees, room.capacity)
        occurrences = rules.weekly_occurrences(data.starts_at, data.ends_at, data.weeks)
        self._ensure_free(room.id, occurrences)

        fields = data.model_dump(exclude={"weeks", "starts_at", "ends_at"})
        series_id = uuid4()
        created = self.reservations.create_many(
            {
                **fields,
                "starts_at": starts_at,
                "ends_at": ends_at,
                "status": ReservationStatus.PENDING.value,
                "series_id": series_id,
            }
            for starts_at, ends_at in occurrences
        )
        return [Reservation.model_validate(reservation) for reservation in created]

    def replace_reservation(self, reservation_id: int, data: ReservationUpdate) -> Reservation:
        room = self._lock_room(data.room_id)
        reservation = self._lock_reservation(reservation_id)
        rules.ensure_editable(ReservationStatus(reservation.status))
        rules.validate_period(data.starts_at, data.ends_at, self.now())
        rules.validate_attendees(data.attendees, room.capacity)
        self._ensure_free(room.id, [(data.starts_at, data.ends_at)], exclude_id=reservation.id)
        updated = self.reservations.update(reservation, data.model_dump())
        return Reservation.model_validate(updated)

    def approve(self, reservation_id: int) -> Reservation:
        return self._change_status(reservation_id, ReservationStatus.APPROVED)

    def reject(self, reservation_id: int) -> Reservation:
        return self._change_status(reservation_id, ReservationStatus.REJECTED)

    def cancel(self, reservation_id: int) -> Reservation:
        return self._change_status(reservation_id, ReservationStatus.CANCELLED)

    def cancel_series(self, series_id: UUID) -> list[Reservation]:
        reservations = self.reservations.list_series_for_update(series_id)
        if not reservations:
            raise SeriesNotFoundError(series_id)

        now = self.now()
        cancellable = [
            reservation
            for reservation in reservations
            if ReservationStatus(reservation.status) in ACTIVE_STATUSES
            and reservation.starts_at > now
        ]
        self.reservations.update_status(cancellable, ReservationStatus.CANCELLED.value)
        return [Reservation.model_validate(reservation) for reservation in reservations]

    def delete_reservation(self, reservation_id: int) -> None:
        reservation = self._lock_reservation(reservation_id)
        rules.ensure_deletable(ReservationStatus(reservation.status))
        self.reservations.delete(reservation)

    def _change_status(self, reservation_id: int, target: ReservationStatus) -> Reservation:
        reservation = self._lock_reservation(reservation_id)
        rules.ensure_can_transition(
            ReservationStatus(reservation.status), target, reservation.starts_at, self.now()
        )
        updated = self.reservations.update(reservation, {"status": target.value})
        return Reservation.model_validate(updated)

    def _ensure_free(
        self,
        room_id: int,
        periods: list[tuple[datetime, datetime]],
        exclude_id: int | None = None,
    ) -> None:
        conflicts = [
            conflict
            for starts_at, ends_at in periods
            for conflict in self.reservations.find_conflicts(
                room_id, starts_at, ends_at, exclude_id=exclude_id
            )
        ]
        if conflicts:
            raise ReservationConflictError(
                [(conflict.starts_at, conflict.ends_at) for conflict in conflicts]
            )

    def _lock_room(self, room_id: int) -> RoomModel:
        room = self.rooms.get_for_update(room_id)
        if room is None:
            raise RoomNotFoundError(room_id)
        return room

    def _lock_reservation(self, reservation_id: int) -> ReservationModel:
        reservation = self.reservations.get_for_update(reservation_id)
        if reservation is None:
            raise ReservationNotFoundError(reservation_id)
        return reservation
