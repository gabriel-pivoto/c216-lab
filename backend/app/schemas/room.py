from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.domain.enums import RoomKind, RoomResource

MAX_CAPACITY = 1000

RoomName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
RoomLocation = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)
]


class RoomBase(BaseModel):
    name: RoomName = Field(examples=["Laboratório 3"])
    kind: RoomKind = Field(examples=[RoomKind.LABORATORY])
    location: RoomLocation = Field(examples=["Prédio 2, 1º andar"])
    capacity: int = Field(gt=0, le=MAX_CAPACITY, examples=[30])
    resources: list[RoomResource] = Field(default_factory=list, examples=[["projector"]])

    @field_validator("resources")
    @classmethod
    def remove_duplicates(cls, resources: list[RoomResource]) -> list[RoomResource]:
        return list(dict.fromkeys(resources))


class RoomCreate(RoomBase):
    pass


class RoomUpdate(RoomBase):
    pass


class Room(RoomBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(gt=0, examples=[1])
