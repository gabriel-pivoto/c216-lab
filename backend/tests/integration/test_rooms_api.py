import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.usefixtures("database")


def test_create_room_returns_201_and_the_room(client: TestClient, room_payload: dict) -> None:
    response = client.post("/rooms", json=room_payload)

    assert response.status_code == 201
    assert response.json() == {"id": 1, **room_payload}


def test_created_room_is_persisted(client: TestClient, room_payload: dict) -> None:
    created = client.post("/rooms", json=room_payload).json()

    response = client.get(f"/rooms/{created['id']}")

    assert response.status_code == 200
    assert response.json() == created


def test_create_room_with_a_duplicated_name_returns_409(
    client: TestClient, room_payload: dict
) -> None:
    client.post("/rooms", json=room_payload)

    response = client.post("/rooms", json=room_payload)

    assert response.status_code == 409
    assert "Laboratório 3" in response.json()["detail"]


@pytest.mark.parametrize(
    "field, value",
    [("name", ""), ("kind", "garage"), ("capacity", 0), ("resources", ["teleporter"])],
)
def test_create_room_with_invalid_data_returns_422(
    client: TestClient, room_payload: dict, field: str, value: object
) -> None:
    response = client.post("/rooms", json={**room_payload, field: value})

    assert response.status_code == 422


def test_list_rooms_applies_the_filters(client: TestClient, room_payload: dict) -> None:
    client.post("/rooms", json=room_payload)
    client.post(
        "/rooms",
        json={
            **room_payload,
            "name": "Sala 10",
            "kind": "classroom",
            "capacity": 50,
            "resources": ["projector"],
        },
    )

    by_kind = client.get("/rooms", params={"kind": "classroom"}).json()
    by_capacity = client.get("/rooms", params={"min_capacity": 40}).json()
    by_resource = client.get("/rooms", params={"resource": ["projector", "computers"]}).json()

    assert [room["name"] for room in by_kind] == ["Sala 10"]
    assert [room["name"] for room in by_capacity] == ["Sala 10"]
    assert [room["name"] for room in by_resource] == ["Laboratório 3"]


def test_replace_room_updates_every_field(client: TestClient, room_payload: dict) -> None:
    created = client.post("/rooms", json=room_payload).json()
    changes = {**room_payload, "capacity": 25, "resources": []}

    response = client.put(f"/rooms/{created['id']}", json=changes)

    assert response.status_code == 200
    assert client.get(f"/rooms/{created['id']}").json() == {"id": created["id"], **changes}


def test_delete_room_returns_204_and_removes_it(client: TestClient, room_payload: dict) -> None:
    created = client.post("/rooms", json=room_payload).json()

    response = client.delete(f"/rooms/{created['id']}")

    assert response.status_code == 204
    assert client.get(f"/rooms/{created['id']}").status_code == 404


@pytest.mark.parametrize("method", ["get", "delete"])
def test_missing_room_returns_404(client: TestClient, method: str) -> None:
    response = getattr(client, method)("/rooms/99")

    assert response.status_code == 404
    assert response.json() == {"detail": "Sala 99 não encontrada."}


def test_replace_missing_room_returns_404(client: TestClient, room_payload: dict) -> None:
    assert client.put("/rooms/99", json=room_payload).status_code == 404


def test_room_id_must_be_positive(client: TestClient) -> None:
    assert client.get("/rooms/0").status_code == 422
