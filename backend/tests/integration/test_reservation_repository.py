from datetime import timedelta

import pytest
from sqlalchemy.orm import Session

from app.domain.errors import ReservationConflictError
from app.repositories.reservation import ReservationRepository
from app.repositories.room import RoomRepository
from tests.support import next_week_at


@pytest.fixture
def repository(db_session: Session) -> ReservationRepository:
    return ReservationRepository(db_session)


@pytest.fixture
def room_id(db_session: Session) -> int:
    room = RoomRepository(db_session).create(
        {"name": "Sala 1", "kind": "classroom", "location": "Prédio 1", "capacity": 40}
    )
    return room.id


def build_reservation(room_id: int, **overrides) -> dict:
    return {
        "room_id": room_id,
        "title": "Aula",
        "requester_name": "Ana Souza",
        "requester_email": "ana@example.com",
        "attendees": 10,
        "starts_at": next_week_at(10),
        "ends_at": next_week_at(12),
        "status": "pending",
        **overrides,
    }


def test_database_rejects_overlaps_without_the_service_check(
    repository: ReservationRepository, room_id: int
) -> None:
    repository.create(build_reservation(room_id))

    with pytest.raises(ReservationConflictError):
        repository.create(
            build_reservation(room_id, starts_at=next_week_at(11), ends_at=next_week_at(13))
        )

    assert len(repository.list_all()) == 1


def test_database_allows_an_overlap_with_a_cancelled_reservation(
    repository: ReservationRepository, room_id: int
) -> None:
    repository.create(build_reservation(room_id, status="cancelled"))

    repository.create(build_reservation(room_id))

    assert len(repository.list_all()) == 2


def test_create_many_is_all_or_nothing(repository: ReservationRepository, room_id: int) -> None:
    with pytest.raises(ReservationConflictError):
        repository.create_many(
            [
                build_reservation(room_id, title="Primeira"),
                build_reservation(room_id, title="Conflitante"),
            ]
        )

    assert repository.list_all() == []


def test_find_conflicts_ignores_the_excluded_reservation(
    repository: ReservationRepository, room_id: int
) -> None:
    reservation = repository.create(build_reservation(room_id))

    assert repository.find_conflicts(room_id, next_week_at(11), next_week_at(13)) == [reservation]
    assert (
        repository.find_conflicts(
            room_id, next_week_at(11), next_week_at(13), exclude_id=reservation.id
        )
        == []
    )


def test_future_queries_ignore_past_and_closed_reservations(
    repository: ReservationRepository, room_id: int
) -> None:
    now = next_week_at(0)
    repository.create(
        build_reservation(
            room_id,
            attendees=35,
            starts_at=now - timedelta(days=1, hours=-10),
            ends_at=now - timedelta(days=1, hours=-11),
        )
    )
    repository.create(build_reservation(room_id, attendees=30, status="cancelled"))

    assert repository.has_future_active(room_id, now) is False
    assert repository.max_future_attendees(room_id, now) == 0

    repository.create(build_reservation(room_id, attendees=12))

    assert repository.has_future_active(room_id, now) is True
    assert repository.max_future_attendees(room_id, now) == 12
