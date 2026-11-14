import pytest
from fastapi.testclient import TestClient

from app.api.cors import get_cors_origins

FRONTEND_ORIGIN = get_cors_origins()[0]
UNKNOWN_ORIGIN = "http://unknown.example"


def _preflight(client: TestClient, origin: str, method: str = "POST"):
    return client.options(
        "/books",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": method,
            "Access-Control-Request-Headers": "Content-Type",
        },
    )


@pytest.mark.parametrize("method", ["GET", "POST", "PUT", "PATCH", "DELETE"])
def test_preflight_allows_the_frontend_origin(client: TestClient, method: str) -> None:
    response = _preflight(client, FRONTEND_ORIGIN, method)

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND_ORIGIN
    assert method in response.headers["access-control-allow-methods"]


def test_preflight_rejects_an_unknown_origin(client: TestClient) -> None:
    response = _preflight(client, UNKNOWN_ORIGIN)

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_response_allows_the_frontend_origin(client: TestClient) -> None:
    response = client.get("/", headers={"Origin": FRONTEND_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND_ORIGIN


def test_response_does_not_allow_an_unknown_origin(client: TestClient) -> None:
    response = client.get("/", headers={"Origin": UNKNOWN_ORIGIN})

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers
