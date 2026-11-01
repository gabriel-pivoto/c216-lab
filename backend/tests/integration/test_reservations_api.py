from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier

import pytest
from fastapi.testclient import TestClient

from app.domain.clock import local_now
from tests.support import iso, next_week_at

pytestmark = pytest.mark.usefixtures("database")


@pytest.fixture
def room(client: TestClient, room_payload: dict) -> dict:
    return client.post("/rooms", json=room_payload).json()


@pytest.fixture
def payload(room: dict) -> dict:
    return {
        "room_id": room["id"],
        "title": "Aula de Sistemas Distribuídos",
        "requester_name": "Ana Souza",
        "requester_email": "ana@example.com",
        "attendees": 20,
        "starts_at": iso(next_week_at(10)),
        "ends_at": iso(next_week_at(12)),
    }


def create(client: TestClient, payload: dict, **overrides) -> dict:
    response = client.post("/reservations", json={**payload, **overrides})
    assert response.status_code == 201, response.text
    return response.json()


def test_create_returns_a_pending_reservation(client: TestClient, payload: dict) -> None:
    response = client.post("/reservations", json=payload)

    body = response.json()
    assert response.status_code == 201
    assert body["status"] == "pending"
    assert body["series_id"] is None
    assert client.get(f"/reservations/{body['id']}").json() == body


def test_create_for_a_missing_room_returns_404(client: TestClient, payload: dict) -> None:
    assert client.post("/reservations", json={**payload, "room_id": 99}).status_code == 404


def test_create_above_the_capacity_returns_422(client: TestClient, payload: dict) -> None:
    response = client.post("/reservations", json={**payload, "attendees": 31})

    assert response.status_code == 422
    assert "comporta 30" in response.json()["detail"]


def test_create_in_the_past_returns_422(client: TestClient, payload: dict) -> None:
    yesterday = local_now() - timedelta(days=1)
    response = client.post(
        "/reservations",
        json={
            **payload,
            "starts_at": iso(yesterday.replace(hour=10, minute=0)),
            "ends_at": iso(yesterday.replace(hour=11, minute=0)),
        },
    )

    assert response.status_code == 422
    assert "passado" in response.json()["detail"]


@pytest.mark.parametrize(
    "start_hour, end_hour",
    [(9, 11), (11, 13), (10, 12), (9, 13)],
)
def test_overlapping_period_returns_409(
    client: TestClient, payload: dict, start_hour: int, end_hour: int
) -> None:
    create(client, payload)

    response = client.post(
        "/reservations",
        json={
            **payload,
            "starts_at": iso(next_week_at(start_hour)),
            "ends_at": iso(next_week_at(end_hour)),
        },
    )

    assert response.status_code == 409
    assert "já está reservada" in response.json()["detail"]


def test_adjacent_periods_do_not_conflict(client: TestClient, payload: dict) -> None:
    create(client, payload)

    create(client, payload, starts_at=iso(next_week_at(12)), ends_at=iso(next_week_at(13)))
    create(client, payload, starts_at=iso(next_week_at(9)), ends_at=iso(next_week_at(10)))


def test_same_period_in_another_room_does_not_conflict(
    client: TestClient, payload: dict, room_payload: dict
) -> None:
    other = client.post("/rooms", json={**room_payload, "name": "Sala 2"}).json()
    create(client, payload)

    create(client, payload, room_id=other["id"])


@pytest.mark.parametrize("action", ["reject", "cancel"])
def test_closed_reservation_releases_the_period(
    client: TestClient, payload: dict, action: str
) -> None:
    reservation = create(client, payload)

    client.post(f"/reservations/{reservation['id']}/{action}")

    create(client, payload)


def test_concurrent_requests_for_the_same_period_create_only_one(
    client: TestClient, payload: dict
) -> None:
    attempts = 5
    barrier = Barrier(attempts)

    def attempt(_: int) -> int:
        barrier.wait()
        return client.post("/reservations", json=payload).status_code

    with ThreadPoolExecutor(max_workers=attempts) as executor:
        statuses = list(executor.map(attempt, range(attempts)))

    assert sorted(statuses) == [201, 409, 409, 409, 409]
    assert len(client.get("/reservations").json()) == 1


def test_approve_then_cancel(client: TestClient, payload: dict) -> None:
    reservation = create(client, payload)

    approved = client.post(f"/reservations/{reservation['id']}/approve")
    cancelled = client.post(f"/reservations/{reservation['id']}/cancel")

    assert approved.json()["status"] == "approved"
    assert cancelled.json()["status"] == "cancelled"


def test_invalid_transition_returns_409(client: TestClient, payload: dict) -> None:
    reservation = create(client, payload)
    client.post(f"/reservations/{reservation['id']}/reject")

    response = client.post(f"/reservations/{reservation['id']}/approve")

    assert response.status_code == 409


def test_update_changes_a_pending_reservation(client: TestClient, payload: dict) -> None:
    reservation = create(client, payload)
    changes = {**payload, "title": "Reunião", "ends_at": iso(next_week_at(11))}

    response = client.put(f"/reservations/{reservation['id']}", json=changes)

    assert response.status_code == 200
    assert response.json()["title"] == "Reunião"
    assert response.json()["ends_at"] == changes["ends_at"]


def test_update_does_not_conflict_with_itself(client: TestClient, payload: dict) -> None:
    reservation = create(client, payload)

    response = client.put(f"/reservations/{reservation['id']}", json=payload)

    assert response.status_code == 200


def test_update_into_another_reservation_returns_409(client: TestClient, payload: dict) -> None:
    create(client, payload)
    other = create(client, payload, starts_at=iso(next_week_at(14)), ends_at=iso(next_week_at(15)))

    response = client.put(f"/reservations/{other['id']}", json=payload)

    assert response.status_code == 409


def test_update_of_an_approved_reservation_returns_409(client: TestClient, payload: dict) -> None:
    reservation = create(client, payload)
    client.post(f"/reservations/{reservation['id']}/approve")

    response = client.put(f"/reservations/{reservation['id']}", json=payload)

    assert response.status_code == 409


def test_delete_pending_reservation(client: TestClient, payload: dict) -> None:
    reservation = create(client, payload)

    assert client.delete(f"/reservations/{reservation['id']}").status_code == 204
    assert client.get(f"/reservations/{reservation['id']}").status_code == 404


def test_delete_approved_reservation_returns_409(client: TestClient, payload: dict) -> None:
    reservation = create(client, payload)
    client.post(f"/reservations/{reservation['id']}/approve")

    assert client.delete(f"/reservations/{reservation['id']}").status_code == 409


def test_list_applies_the_filters(client: TestClient, payload: dict) -> None:
    first = create(client, payload)
    second = create(
        client,
        payload,
        requester_email="bia@example.com",
        starts_at=iso(next_week_at(14)),
        ends_at=iso(next_week_at(15)),
    )
    client.post(f"/reservations/{second['id']}/approve")
    day = next_week_at(0).date()

    def ids(**params) -> list[int]:
        return [item["id"] for item in client.get("/reservations", params=params).json()]

    assert ids() == [first["id"], second["id"]]
    assert ids(status="approved") == [second["id"]]
    assert ids(status=["pending", "approved"]) == [first["id"], second["id"]]
    assert ids(requester_email="BIA@example.com") == [second["id"]]
    assert ids(room_id=99) == []
    assert ids(date_from=day.isoformat(), date_to=day.isoformat()) == [first["id"], second["id"]]
    assert ids(date_to=(day - timedelta(days=1)).isoformat()) == []
    assert ids(date_from=(day + timedelta(days=1)).isoformat()) == []


def test_recurring_creates_one_reservation_per_week(client: TestClient, payload: dict) -> None:
    response = client.post("/reservations/recurring", json={**payload, "weeks": 3})

    body = response.json()
    assert response.status_code == 201
    assert [item["starts_at"] for item in body] == [
        iso(next_week_at(10) + timedelta(weeks=week)) for week in range(3)
    ]
    assert len({item["series_id"] for item in body}) == 1
    assert body[0]["series_id"] is not None


def test_recurring_with_a_conflict_creates_nothing(client: TestClient, payload: dict) -> None:
    create(
        client,
        payload,
        starts_at=iso(next_week_at(10) + timedelta(weeks=2)),
        ends_at=iso(next_week_at(12) + timedelta(weeks=2)),
    )

    response = client.post("/reservations/recurring", json={**payload, "weeks": 3})

    conflict_day = (next_week_at(10) + timedelta(weeks=2)).strftime("%d/%m/%Y")
    assert response.status_code == 409
    assert conflict_day in response.json()["detail"]
    assert len(client.get("/reservations").json()) == 1


def test_cancel_series_cancels_active_reservations(client: TestClient, payload: dict) -> None:
    series = client.post("/reservations/recurring", json={**payload, "weeks": 3}).json()
    client.post(f"/reservations/{series[0]['id']}/approve")
    client.post(f"/reservations/{series[1]['id']}/reject")

    response = client.post(f"/reservations/series/{series[0]['series_id']}/cancel")

    assert response.status_code == 200
    assert [item["status"] for item in response.json()] == ["cancelled", "rejected", "cancelled"]


def test_cancel_missing_series_returns_404(client: TestClient) -> None:
    response = client.post("/reservations/series/00000000-0000-0000-0000-000000000000/cancel")

    assert response.status_code == 404


def test_room_with_a_future_reservation_cannot_be_deleted(
    client: TestClient, payload: dict, room: dict
) -> None:
    reservation = create(client, payload)

    assert client.delete(f"/rooms/{room['id']}").status_code == 409

    client.post(f"/reservations/{reservation['id']}/cancel")

    assert client.delete(f"/rooms/{room['id']}").status_code == 204
    assert client.get(f"/reservations/{reservation['id']}").status_code == 404


def test_capacity_cannot_drop_below_a_future_reservation(
    client: TestClient, payload: dict, room: dict, room_payload: dict
) -> None:
    create(client, payload)

    below = client.put(f"/rooms/{room['id']}", json={**room_payload, "capacity": 19})
    equal = client.put(f"/rooms/{room['id']}", json={**room_payload, "capacity": 20})

    assert below.status_code == 409
    assert equal.status_code == 200
