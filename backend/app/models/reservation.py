from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Uuid,
    column,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base

RESERVATION_PERIOD_CONSTRAINT = "ex_reservations_room_period"


class ReservationModel(Base):
    __tablename__ = "reservations"
    __table_args__ = (
        CheckConstraint("attendees > 0", name="ck_reservations_attendees_positive"),
        CheckConstraint("ends_at > starts_at", name="ck_reservations_period_valid"),
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'cancelled')",
            name="ck_reservations_status_valid",
        ),
        ExcludeConstraint(
            (column("room_id"), "="),
            (func.tsrange(column("starts_at"), column("ends_at")), "&&"),
            using="gist",
            where=text("status IN ('pending', 'approved')"),
            name=RESERVATION_PERIOD_CONSTRAINT,
        ),
        Index("ix_reservations_starts_at", "starts_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(120))
    requester_name: Mapped[str] = mapped_column(String(100))
    requester_email: Mapped[str] = mapped_column(String(254), index=True)
    attendees: Mapped[int] = mapped_column(Integer)
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), index=True)
    series_id: Mapped[UUID | None] = mapped_column(Uuid, index=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
