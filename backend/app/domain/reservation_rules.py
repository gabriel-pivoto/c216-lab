from datetime import datetime, time, timedelta

from app.domain.enums import ReservationStatus
from app.domain.errors import (
    BusinessRuleError,
    InvalidStatusTransitionError,
    ReservationNotDeletableError,
    ReservationNotEditableError,
)

OPENING_TIME = time(7, 0)
CLOSING_TIME = time(23, 0)
MIN_DURATION = timedelta(minutes=30)
MAX_DURATION = timedelta(hours=4)

ALLOWED_TRANSITIONS = {
    ReservationStatus.PENDING: {
        ReservationStatus.APPROVED,
        ReservationStatus.REJECTED,
        ReservationStatus.CANCELLED,
    },
    ReservationStatus.APPROVED: {ReservationStatus.CANCELLED},
    ReservationStatus.REJECTED: set(),
    ReservationStatus.CANCELLED: set(),
}


def validate_period(starts_at: datetime, ends_at: datetime, now: datetime) -> None:
    if ends_at <= starts_at:
        raise BusinessRuleError("O término deve ser depois do início.")
    if starts_at.date() != ends_at.date():
        raise BusinessRuleError("O início e o término devem estar no mesmo dia.")
    if starts_at <= now:
        raise BusinessRuleError("Não é possível reservar um horário no passado.")
    if starts_at.time() < OPENING_TIME or ends_at.time() > CLOSING_TIME:
        raise BusinessRuleError(
            f"As reservas devem ficar entre {OPENING_TIME:%H:%M} e {CLOSING_TIME:%H:%M}."
        )
    if not MIN_DURATION <= ends_at - starts_at <= MAX_DURATION:
        raise BusinessRuleError("A reserva deve durar de 30 minutos a 4 horas.")


def validate_attendees(attendees: int, capacity: int) -> None:
    if attendees > capacity:
        raise BusinessRuleError(
            f"A sala comporta {capacity} pessoas, mas a reserva tem {attendees} participantes."
        )


def ensure_can_transition(
    current: ReservationStatus,
    target: ReservationStatus,
    starts_at: datetime,
    now: datetime,
) -> None:
    if target not in ALLOWED_TRANSITIONS[current]:
        raise InvalidStatusTransitionError(current.value, target.value)
    if starts_at > now:
        return
    if target is ReservationStatus.APPROVED:
        raise BusinessRuleError("Uma reserva que já começou não pode ser aprovada.")
    if current is ReservationStatus.APPROVED:
        raise BusinessRuleError("Uma reserva aprovada que já começou não pode ser cancelada.")


def ensure_editable(status: ReservationStatus) -> None:
    if status is not ReservationStatus.PENDING:
        raise ReservationNotEditableError


def ensure_deletable(status: ReservationStatus) -> None:
    if status is ReservationStatus.APPROVED:
        raise ReservationNotDeletableError


def weekly_occurrences(
    starts_at: datetime, ends_at: datetime, weeks: int
) -> list[tuple[datetime, datetime]]:
    return [
        (starts_at + timedelta(weeks=week), ends_at + timedelta(weeks=week))
        for week in range(weeks)
    ]
