from sqlalchemy import CheckConstraint, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base

ROOM_NAME_CONSTRAINT = "uq_rooms_name"


class RoomModel(Base):
    __tablename__ = "rooms"
    __table_args__ = (
        UniqueConstraint("name", name=ROOM_NAME_CONSTRAINT),
        CheckConstraint("capacity > 0", name="ck_rooms_capacity_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    kind: Mapped[str] = mapped_column(String(20), index=True)
    location: Mapped[str] = mapped_column(String(120))
    capacity: Mapped[int] = mapped_column(Integer)
    resources: Mapped[list[str]] = mapped_column(ARRAY(String(30)), server_default=text("'{}'"))
