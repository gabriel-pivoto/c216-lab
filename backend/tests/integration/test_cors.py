import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def cors_client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("CORS_ORIGINS", "http://allowed.example, http://other.example")
    return TestClient(create_app())


def preflight(client: TestClient, origin: str, method: str = "PUT"):
    return client.options(
        "/rooms/1",
        headers={"Origin": origin, "Access-Control-Request-Method": method},
    )


def test_preflight_accepts_a_configured_origin(cors_client: TestClient) -> None:
    response = preflight(cors_client, "http://other.example")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://other.example"


def test_preflight_rejects_an_unknown_origin(cors_client: TestClient) -> None:
    response = preflight(cors_client, "http://evil.example")

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_preflight_rejects_a_method_the_api_does_not_use(cors_client: TestClient) -> None:
    assert preflight(cors_client, "http://allowed.example", method="PATCH").status_code == 400
