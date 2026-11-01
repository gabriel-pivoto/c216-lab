from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.domain.enums import RoomKind, RoomResource
from app.repositories.reservation import ReservationRepository
from app.repositories.room import RoomRepository
from app.schemas.room import MAX_CAPACITY, Room, RoomCreate, RoomUpdate
from app.services.room import RoomService


def get_room_service(db: Annotated[Session, Depends(get_db)]) -> RoomService:
    return RoomService(RoomRepository(db), ReservationRepository(db))


router = APIRouter(prefix="/rooms", tags=["rooms"])

RoomId = Annotated[int, Path(gt=0, description="Room identifier")]
Service = Annotated[RoomService, Depends(get_room_service)]


@router.get("", response_model=list[Room])
def list_rooms(
    service: Service,
    kind: Annotated[RoomKind | None, Query(description="Filter by room kind")] = None,
    min_capacity: Annotated[
        int | None, Query(gt=0, le=MAX_CAPACITY, description="Minimum capacity")
    ] = None,
    resource: Annotated[
        list[RoomResource] | None, Query(description="Resources the room must have")
    ] = None,
) -> list[Room]:
    return service.list_rooms(kind=kind, min_capacity=min_capacity, resources=resource)


@router.get("/{room_id}", response_model=Room)
def get_room(room_id: RoomId, service: Service) -> Room:
    return service.get_room(room_id)


@router.post("", response_model=Room, status_code=status.HTTP_201_CREATED)
def create_room(data: RoomCreate, service: Service) -> Room:
    return service.create_room(data)


@router.put("/{room_id}", response_model=Room)
def replace_room(room_id: RoomId, data: RoomUpdate, service: Service) -> Room:
    return service.replace_room(room_id, data)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: RoomId, service: Service) -> None:
    service.delete_room(room_id)
