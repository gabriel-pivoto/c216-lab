from datetime import datetime, time, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.domain.clock import local_now
from app.repositories.reservation import ReservationRepository
from app.repositories.room import RoomRepository
from tests.support import next_week_at

pytestmark = pytest.mark.usefixtures("database")


def add_room(session: Session, name: str) -> int:
    room = RoomRepository(session).create(
        {"name": name, "kind": "classroom", "location": "Prédio 1", "capacity": 40}
    )
    return room.id


def add_reservation(
    session: Session, room_id: int, starts_at: datetime, hours: int = 1, status: str = "approved"
) -> None:
    ReservationRepository(session).create(
        {
            "room_id": room_id,
            "title": "Aula",
            "requester_name": "Ana Souza",
            "requester_email": "ana@example.com",
            "attendees": 10,
            "starts_at": starts_at,
            "ends_at": starts_at + timedelta(hours=hours),
            "status": status,
        }
    )


def test_summary_of_an_empty_database(client: TestClient) -> None:
    response = client.get("/dashboard/summary")

    assert response.status_code == 200
    assert response.json() == {
        "total_rooms": 0,
        "pending_reservations": 0,
        "reservations_today": 0,
        "approved_next_7_days": 0,
        "occupancy_today_percent": 0.0,
        "busiest_rooms": [],
    }


def test_summary_counts_reservations(client: TestClient, db_session: Session) -> None:
    room_a = add_room(db_session, "Sala A")
    room_b = add_room(db_session, "Sala B")
    today = datetime.combine(local_now().date(), time(8))
    in_three_days = today + timedelta(days=3)

    add_reservation(db_session, room_a, today, hours=4)
    add_reservation(db_session, room_b, today, hours=4, status="cancelled")
    add_reservation(db_session, room_a, in_three_days)
    add_reservation(db_session, room_a, in_three_days + timedelta(hours=2))
    add_reservation(db_session, room_b, in_three_days)
    add_reservation(db_session, room_b, next_week_at(10) + timedelta(days=1), status="pending")

    body = client.get("/dashboard/summary").json()

    assert body["total_rooms"] == 2
    assert body["pending_reservations"] == 1
    assert body["reservations_today"] == 1
    assert body["occupancy_today_percent"] == 12.5
    assert body["busiest_rooms"] == [
        {"room_id": room_a, "room_name": "Sala A", "reservations": 3, "hours": 6.0},
        {"room_id": room_b, "room_name": "Sala B", "reservations": 1, "hours": 1.0},
    ]
    assert body["approved_next_7_days"] >= 3
