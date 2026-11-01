import pytest
from pydantic import ValidationError

from app.schemas.reservation import (
    MAX_WEEKS,
    MIN_WEEKS,
    RecurringReservationCreate,
    ReservationCreate,
)


def build_reservation(**overrides) -> dict:
    return {
        "room_id": 1,
        "title": "Aula",
        "requester_name": "Ana Souza",
        "requester_email": "ana@example.com",
        "attendees": 10,
        "starts_at": "2026-12-01T10:00:00",
        "ends_at": "2026-12-01T12:00:00",
        **overrides,
    }


def test_normalizes_the_email_to_lowercase() -> None:
    reservation = ReservationCreate(**build_reservation(requester_email="Ana@Example.COM"))

    assert reservation.requester_email == "ana@example.com"


def test_strips_whitespace_from_the_title() -> None:
    assert ReservationCreate(**build_reservation(title="  Aula  ")).title == "Aula"


@pytest.mark.parametrize(
    "overrides",
    [
        {"room_id": 0},
        {"title": "   "},
        {"title": "x" * 121},
        {"requester_name": ""},
        {"requester_email": "not-an-email"},
        {"attendees": 0},
        {"starts_at": "amanhã"},
        {"starts_at": "2026-12-01T10:00:00-03:00"},
    ],
)
def test_rejects_invalid_data(overrides: dict) -> None:
    with pytest.raises(ValidationError):
        ReservationCreate(**build_reservation(**overrides))


@pytest.mark.parametrize("weeks", [MIN_WEEKS, MAX_WEEKS])
def test_recurring_accepts_the_week_limits(weeks: int) -> None:
    assert RecurringReservationCreate(**build_reservation(weeks=weeks)).weeks == weeks


@pytest.mark.parametrize("weeks", [MIN_WEEKS - 1, MAX_WEEKS + 1])
def test_recurring_rejects_weeks_out_of_range(weeks: int) -> None:
    with pytest.raises(ValidationError):
        RecurringReservationCreate(**build_reservation(weeks=weeks))
