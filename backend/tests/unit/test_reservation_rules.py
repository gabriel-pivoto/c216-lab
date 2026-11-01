from datetime import datetime, timedelta

import pytest

from app.domain import reservation_rules as rules
from app.domain.enums import ReservationStatus as Status
from app.domain.errors import (
    BusinessRuleError,
    InvalidStatusTransitionError,
    ReservationNotDeletableError,
    ReservationNotEditableError,
)

NOW = datetime(2026, 11, 2, 8, 0)
DAY = datetime(2026, 11, 10)


def at(hour: int, minute: int = 0) -> datetime:
    return DAY.replace(hour=hour, minute=minute)


@pytest.mark.parametrize(
    "starts_at, ends_at",
    [
        (at(7), at(7, 30)),
        (at(19), at(23)),
        (at(10), at(14)),
    ],
)
def test_accepts_periods_inside_the_limits(starts_at: datetime, ends_at: datetime) -> None:
    rules.validate_period(starts_at, ends_at, NOW)


@pytest.mark.parametrize(
    "starts_at, ends_at, message",
    [
        (at(12), at(10), "depois do início"),
        (at(12), at(12), "depois do início"),
        (at(22), at(9) + timedelta(days=1), "mesmo dia"),
        (NOW - timedelta(hours=1), NOW, "passado"),
        (NOW, NOW + timedelta(hours=1), "passado"),
        (at(6, 59), at(8), "entre 07:00 e 23:00"),
        (at(22), at(23, 1), "entre 07:00 e 23:00"),
        (at(10), at(10, 29), "30 minutos a 4 horas"),
        (at(10), at(14, 1), "30 minutos a 4 horas"),
    ],
)
def test_rejects_invalid_periods(starts_at: datetime, ends_at: datetime, message: str) -> None:
    with pytest.raises(BusinessRuleError, match=message):
        rules.validate_period(starts_at, ends_at, NOW)


def test_attendees_can_fill_the_room() -> None:
    rules.validate_attendees(30, 30)


def test_attendees_cannot_exceed_the_capacity() -> None:
    with pytest.raises(BusinessRuleError, match="comporta 30"):
        rules.validate_attendees(31, 30)


@pytest.mark.parametrize(
    "current, target",
    [
        (Status.PENDING, Status.APPROVED),
        (Status.PENDING, Status.REJECTED),
        (Status.PENDING, Status.CANCELLED),
        (Status.APPROVED, Status.CANCELLED),
    ],
)
def test_allows_the_valid_transitions(current: Status, target: Status) -> None:
    rules.ensure_can_transition(current, target, at(10), NOW)


@pytest.mark.parametrize(
    "current, target",
    [
        (Status.APPROVED, Status.REJECTED),
        (Status.APPROVED, Status.APPROVED),
        (Status.REJECTED, Status.APPROVED),
        (Status.REJECTED, Status.CANCELLED),
        (Status.CANCELLED, Status.APPROVED),
        (Status.CANCELLED, Status.REJECTED),
    ],
)
def test_rejects_the_invalid_transitions(current: Status, target: Status) -> None:
    with pytest.raises(InvalidStatusTransitionError):
        rules.ensure_can_transition(current, target, at(10), NOW)


def test_started_reservation_cannot_be_approved() -> None:
    with pytest.raises(BusinessRuleError, match="aprovada"):
        rules.ensure_can_transition(Status.PENDING, Status.APPROVED, NOW, NOW)


def test_started_approved_reservation_cannot_be_cancelled() -> None:
    with pytest.raises(BusinessRuleError, match="cancelada"):
        rules.ensure_can_transition(Status.APPROVED, Status.CANCELLED, NOW, NOW)


@pytest.mark.parametrize("target", [Status.REJECTED, Status.CANCELLED])
def test_started_pending_reservation_can_still_be_closed(target: Status) -> None:
    rules.ensure_can_transition(Status.PENDING, target, NOW, NOW)


def test_only_pending_reservations_are_editable() -> None:
    rules.ensure_editable(Status.PENDING)

    for status in (Status.APPROVED, Status.REJECTED, Status.CANCELLED):
        with pytest.raises(ReservationNotEditableError):
            rules.ensure_editable(status)


def test_only_approved_reservations_cannot_be_deleted() -> None:
    for status in (Status.PENDING, Status.REJECTED, Status.CANCELLED):
        rules.ensure_deletable(status)

    with pytest.raises(ReservationNotDeletableError):
        rules.ensure_deletable(Status.APPROVED)


def test_weekly_occurrences_repeat_the_same_time_every_week() -> None:
    occurrences = rules.weekly_occurrences(at(10), at(12), 3)

    assert occurrences == [
        (at(10), at(12)),
        (at(10) + timedelta(weeks=1), at(12) + timedelta(weeks=1)),
        (at(10) + timedelta(weeks=2), at(12) + timedelta(weeks=2)),
    ]
