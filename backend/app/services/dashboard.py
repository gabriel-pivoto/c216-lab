from collections.abc import Callable
from datetime import datetime, time, timedelta

from app.domain.clock import local_now
from app.domain.reservation_rules import CLOSING_TIME, OPENING_TIME
from app.repositories.dashboard import DashboardRepository
from app.schemas.dashboard import BusyRoom, DashboardSummary

BUSIEST_ROOMS_LIMIT = 5
BUSIEST_ROOMS_WINDOW = timedelta(days=30)
OPEN_HOURS_PER_DAY = CLOSING_TIME.hour - OPENING_TIME.hour


class DashboardService:
    def __init__(
        self,
        repository: DashboardRepository,
        now: Callable[[], datetime] = local_now,
    ) -> None:
        self.repository = repository
        self.now = now

    def get_summary(self) -> DashboardSummary:
        now = self.now()
        today = datetime.combine(now.date(), time.min)
        tomorrow = today + timedelta(days=1)
        total_rooms = self.repository.count_rooms()
        busiest = self.repository.busiest_rooms(
            now - BUSIEST_ROOMS_WINDOW, now + BUSIEST_ROOMS_WINDOW, BUSIEST_ROOMS_LIMIT
        )

        return DashboardSummary(
            total_rooms=total_rooms,
            pending_reservations=self.repository.count_pending(now),
            reservations_today=self.repository.count_active_between(today, tomorrow),
            approved_next_7_days=self.repository.count_approved_between(
                now, now + timedelta(days=7)
            ),
            occupancy_today_percent=occupancy_percent(
                self.repository.active_hours_between(today, tomorrow), total_rooms
            ),
            busiest_rooms=[
                BusyRoom(
                    room_id=row.room_id,
                    room_name=row.room_name,
                    reservations=row.reservations,
                    hours=float(row.hours),
                )
                for row in busiest
            ],
        )


def occupancy_percent(reserved_hours: float, total_rooms: int) -> float:
    if total_rooms == 0:
        return 0.0
    return round(100 * reserved_hours / (total_rooms * OPEN_HOURS_PER_DAY), 1)
