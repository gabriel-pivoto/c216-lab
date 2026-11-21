from pydantic import BaseModel, Field


class BusyRoom(BaseModel):
    room_id: int
    room_name: str
    reservations: int
    hours: float


class DashboardSummary(BaseModel):
    total_rooms: int
    pending_reservations: int
    reservations_today: int
    approved_next_7_days: int
    occupancy_today_percent: float = Field(ge=0, le=100)
    busiest_rooms: list[BusyRoom]
