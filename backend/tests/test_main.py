import pytest
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    return TestClient(app)


def test_status_returns_200(client):
    assert client.get("/").status_code == 200


def test_status_returns_ok_body(client):
    assert client.get("/").json() == {"status": "ok"}


def test_status_returns_json(client):
    assert client.get("/").headers["content-type"] == "application/json"


@pytest.mark.parametrize("route", ["/unknown", "/status", "/api/v1"])
def test_unknown_route_returns_404(client, route):
    assert client.get(route).status_code == 404


@pytest.mark.parametrize("method", ["post", "put", "delete"])
def test_method_not_allowed_returns_405(client, method):
    assert getattr(client, method)("/").status_code == 405
