from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query, status
from pydantic import EmailStr
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.domain.enums import ReservationStatus
from app.repositories.reservation import ReservationRepository
from app.repositories.room import RoomRepository
from app.schemas.reservation import (
    RecurringReservationCreate,
    Reservation,
    ReservationCreate,
    ReservationUpdate,
)
from app.services.reservation import ReservationService


def get_reservation_service(db: Annotated[Session, Depends(get_db)]) -> ReservationService:
    return ReservationService(ReservationRepository(db), RoomRepository(db))


router = APIRouter(prefix="/reservations", tags=["reservations"])

ReservationId = Annotated[int, Path(gt=0, description="Reservation identifier")]
Service = Annotated[ReservationService, Depends(get_reservation_service)]


@router.get("", response_model=list[Reservation])
def list_reservations(
    service: Service,
    room_id: Annotated[int | None, Query(gt=0, description="Filter by room")] = None,
    status_filter: Annotated[
        list[ReservationStatus] | None, Query(alias="status", description="Filter by status")
    ] = None,
    requester_email: Annotated[
        EmailStr | None, Query(description="Filter by requester e-mail")
    ] = None,
    date_from: Annotated[date | None, Query(description="First day, inclusive")] = None,
    date_to: Annotated[date | None, Query(description="Last day, inclusive")] = None,
    limit: Annotated[int, Query(ge=1, le=500, description="Maximum number of items")] = 200,
) -> list[Reservation]:
    return service.list_reservations(
        room_id=room_id,
        statuses=status_filter,
        requester_email=requester_email,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
    )


@router.post("", response_model=Reservation, status_code=status.HTTP_201_CREATED)
def create_reservation(data: ReservationCreate, service: Service) -> Reservation:
    return service.create_reservation(data)


@router.post("/recurring", response_model=list[Reservation], status_code=status.HTTP_201_CREATED)
def create_recurring_reservation(
    data: RecurringReservationCreate, service: Service
) -> list[Reservation]:
    return service.create_recurring(data)


@router.post("/series/{series_id}/cancel", response_model=list[Reservation])
def cancel_series(series_id: UUID, service: Service) -> list[Reservation]:
    return service.cancel_series(series_id)


@router.get("/{reservation_id}", response_model=Reservation)
def get_reservation(reservation_id: ReservationId, service: Service) -> Reservation:
    return service.get_reservation(reservation_id)


@router.put("/{reservation_id}", response_model=Reservation)
def replace_reservation(
    reservation_id: ReservationId, data: ReservationUpdate, service: Service
) -> Reservation:
    return service.replace_reservation(reservation_id, data)


@router.post("/{reservation_id}/approve", response_model=Reservation)
def approve_reservation(reservation_id: ReservationId, service: Service) -> Reservation:
    return service.approve(reservation_id)


@router.post("/{reservation_id}/reject", response_model=Reservation)
def reject_reservation(reservation_id: ReservationId, service: Service) -> Reservation:
    return service.reject(reservation_id)


@router.post("/{reservation_id}/cancel", response_model=Reservation)
def cancel_reservation(reservation_id: ReservationId, service: Service) -> Reservation:
    return service.cancel(reservation_id)


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reservation(reservation_id: ReservationId, service: Service) -> None:
    service.delete_reservation(reservation_id)
