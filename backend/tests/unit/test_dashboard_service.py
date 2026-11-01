from app.services.dashboard import occupancy_percent


def test_occupancy_is_zero_without_rooms() -> None:
    assert occupancy_percent(10, 0) == 0.0


def test_occupancy_uses_the_open_hours_of_every_room() -> None:
    assert occupancy_percent(8, 1) == 50.0
    assert occupancy_percent(8, 2) == 25.0


def test_occupancy_is_rounded_to_one_decimal() -> None:
    assert occupancy_percent(1, 3) == 2.1
