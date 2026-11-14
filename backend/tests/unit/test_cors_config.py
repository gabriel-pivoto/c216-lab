import pytest

from app.api.cors import DEFAULT_CORS_ORIGINS, get_cors_origins


def test_cors_origins_fall_back_to_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    assert get_cors_origins() == list(DEFAULT_CORS_ORIGINS)


def test_cors_origins_fall_back_to_default_when_blank(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", " , ")

    assert get_cors_origins() == list(DEFAULT_CORS_ORIGINS)


def test_cors_origins_are_split_by_comma_and_normalized(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", " http://localhost:3000/ ,https://app.example.com")

    assert get_cors_origins() == ["http://localhost:3000", "https://app.example.com"]


def test_cors_origins_reject_wildcard(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173,*")

    with pytest.raises(ValueError, match="does not accept"):
        get_cors_origins()
