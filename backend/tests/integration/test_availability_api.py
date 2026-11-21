from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.domain.clock import local_now
from tests.support import iso, next_week_at

pytestmark = pytest.mark.usefixtures("database")


@pytest.fixture
def rooms(client: TestClient, room_payload: dict) -> dict[str, dict]:
    small = {
        **room_payload,
        "name": "Sala pequena",
        "kind": "classroom",
        "capacity": 10,
        "resources": ["whiteboard"],
    }
    large = {
        **room_payload,
        "name": "Lab grande",
        "kind": "laboratory",
        "capacity": 40,
        "resources": ["projector", "computers"],
    }
    return {
        "small": client.post("/rooms", json=small).json(),
        "large": client.post("/rooms", json=large).json(),
    }


def period(start_hour: int = 10, end_hour: int = 12) -> dict:
    return {"starts_at": iso(next_week_at(start_hour)), "ends_at": iso(next_week_at(end_hour))}


def reserve(client: TestClient, room: dict, start_hour: int = 10, end_hour: int = 12) -> dict:
    response = client.post(
        "/reservations",
        json={
            "room_id": room["id"],
            "title": "Aula",
            "requester_name": "Ana Souza",
            "requester_email": "ana@example.com",
            "attendees": 5,
            **period(start_hour, end_hour),
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def names(client: TestClient, **params) -> list[str]:
    response = client.get("/rooms/available", params={**period(), **params})
    assert response.status_code == 200, response.text
    return [room["name"] for room in response.json()]


def test_lists_every_free_room_from_smallest_to_largest(client: TestClient, rooms: dict) -> None:
    assert names(client) == ["Sala pequena", "Lab grande"]


def test_hides_rooms_with_an_active_reservation_in_the_period(
    client: TestClient, rooms: dict
) -> None:
    reserve(client, rooms["small"], 11, 13)

    assert names(client) == ["Lab grande"]


def test_keeps_rooms_reserved_only_outside_the_period(client: TestClient, rooms: dict) -> None:
    reserve(client, rooms["small"], 12, 13)

    assert "Sala pequena" in names(client)


def test_keeps_rooms_whose_reservation_was_cancelled(client: TestClient, rooms: dict) -> None:
    reservation = reserve(client, rooms["small"])
    client.post(f"/reservations/{reservation['id']}/cancel")

    assert "Sala pequena" in names(client)


def test_applies_attendees_kind_and_resources(client: TestClient, rooms: dict) -> None:
    assert names(client, attendees=11) == ["Lab grande"]
    assert names(client, kind="classroom") == ["Sala pequena"]
    assert names(client, resource=["projector", "computers"]) == ["Lab grande"]
    assert names(client, resource=["projector", "whiteboard"]) == []


def test_invalid_period_returns_422(client: TestClient, rooms: dict) -> None:
    response = client.get("/rooms/available", params=period(12, 10))

    assert response.status_code == 422
    assert "depois do início" in response.json()["detail"]


def test_past_period_returns_422(client: TestClient, rooms: dict) -> None:
    yesterday = (local_now() - timedelta(days=1)).replace(hour=10, minute=0)
    response = client.get(
        "/rooms/available",
        params={"starts_at": iso(yesterday), "ends_at": iso(yesterday.replace(hour=11))},
    )

    assert response.status_code == 422
    assert "passado" in response.json()["detail"]


def test_period_is_required(client: TestClient) -> None:
    assert client.get("/rooms/available").status_code == 422
