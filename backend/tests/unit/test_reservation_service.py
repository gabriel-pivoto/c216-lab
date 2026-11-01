from datetime import datetime, timedelta
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.domain.errors import BusinessRuleError, SeriesNotFoundError
from app.services.reservation import ReservationService

NOW = datetime(2026, 11, 10, 12, 0)


def build_reservation(starts_at: datetime, status: str = "pending") -> SimpleNamespace:
    return SimpleNamespace(
        id=1,
        room_id=1,
        title="Aula",
        requester_name="Ana Souza",
        requester_email="ana@example.com",
        attendees=10,
        starts_at=starts_at,
        ends_at=starts_at + timedelta(hours=1),
        status=status,
        series_id=None,
        created_at=NOW,
    )


class FakeReservationRepository:
    def __init__(self, reservations: list[SimpleNamespace]) -> None:
        self.reservations = reservations
        self.cancelled: list[SimpleNamespace] = []

    def get_for_update(self, reservation_id: int) -> SimpleNamespace | None:
        return self.reservations[0] if self.reservations else None

    def list_series_for_update(self, series_id) -> list[SimpleNamespace]:
        return self.reservations

    def update_status(self, reservations: list[SimpleNamespace], status: str) -> None:
        self.cancelled = reservations
        for reservation in reservations:
            reservation.status = status


def build_service(reservations: list[SimpleNamespace]) -> ReservationService:
    return ReservationService(FakeReservationRepository(reservations), None, now=lambda: NOW)


def test_cancel_series_keeps_what_already_started_or_was_closed() -> None:
    past = build_reservation(NOW - timedelta(days=7), status="approved")
    started = build_reservation(NOW, status="approved")
    rejected = build_reservation(NOW + timedelta(days=7), status="rejected")
    pending = build_reservation(NOW + timedelta(days=14), status="pending")
    approved = build_reservation(NOW + timedelta(days=21), status="approved")
    service = build_service([past, started, rejected, pending, approved])

    result = service.cancel_series(uuid4())

    assert [item.status.value for item in result] == [
        "approved",
        "approved",
        "rejected",
        "cancelled",
        "cancelled",
    ]


def test_cancel_series_without_reservations_raises_not_found() -> None:
    with pytest.raises(SeriesNotFoundError):
        build_service([]).cancel_series(uuid4())


def test_approve_uses_the_injected_clock() -> None:
    reservation = build_reservation(NOW - timedelta(minutes=1))

    with pytest.raises(BusinessRuleError):
        build_service([reservation]).approve(1)

    assert reservation.status == "pending"
