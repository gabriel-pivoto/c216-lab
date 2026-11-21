from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    NaiveDatetime,
    StringConstraints,
)

from app.domain.enums import ReservationStatus

MIN_WEEKS = 2
MAX_WEEKS = 12

ReservationTitle = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)
]
RequesterName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]
RequesterEmail = Annotated[EmailStr, AfterValidator(str.lower)]


class ReservationBase(BaseModel):
    room_id: int = Field(gt=0, examples=[1])
    title: ReservationTitle = Field(examples=["Aula de Sistemas Distribuídos"])
    requester_name: RequesterName = Field(examples=["Ana Souza"])
    requester_email: RequesterEmail = Field(examples=["ana@example.com"])
    attendees: int = Field(gt=0, examples=[25])
    starts_at: NaiveDatetime = Field(examples=["2026-12-01T10:00:00"])
    ends_at: NaiveDatetime = Field(examples=["2026-12-01T12:00:00"])


class ReservationCreate(ReservationBase):
    pass


class ReservationUpdate(ReservationBase):
    pass


class RecurringReservationCreate(ReservationBase):
    weeks: int = Field(ge=MIN_WEEKS, le=MAX_WEEKS, examples=[4])


class Reservation(ReservationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(gt=0, examples=[1])
    status: ReservationStatus
    series_id: UUID | None = None
    created_at: datetime
