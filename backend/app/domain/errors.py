from datetime import datetime
from uuid import UUID


class DomainError(Exception):
    pass


class NotFoundError(DomainError):
    pass


class ConflictError(DomainError):
    pass


class BusinessRuleError(DomainError):
    pass


class RoomNotFoundError(NotFoundError):
    def __init__(self, room_id: int) -> None:
        super().__init__(f"Sala {room_id} não encontrada.")
        self.room_id = room_id


class RoomNameConflictError(ConflictError):
    def __init__(self, name: str) -> None:
        super().__init__(f"Já existe uma sala chamada '{name}'.")
        self.name = name


class RoomHasFutureReservationsError(ConflictError):
    def __init__(self) -> None:
        super().__init__("A sala tem reservas futuras ativas e não pode ser excluída.")


class RoomCapacityConflictError(ConflictError):
    def __init__(self, required: int) -> None:
        super().__init__(
            f"A capacidade não pode ser menor que {required}, "
            "o número de participantes de uma reserva futura ativa."
        )
        self.required = required


class ReservationNotFoundError(NotFoundError):
    def __init__(self, reservation_id: int) -> None:
        super().__init__(f"Reserva {reservation_id} não encontrada.")
        self.reservation_id = reservation_id


class SeriesNotFoundError(NotFoundError):
    def __init__(self, series_id: UUID) -> None:
        super().__init__(f"Série de reservas {series_id} não encontrada.")
        self.series_id = series_id


class ReservationConflictError(ConflictError):
    def __init__(self, periods: list[tuple[datetime, datetime]] | None = None) -> None:
        if periods:
            formatted = ", ".join(
                f"{start:%d/%m/%Y} das {start:%H:%M} às {end:%H:%M}" for start, end in periods
            )
            super().__init__(f"A sala já está reservada em: {formatted}.")
        else:
            super().__init__("A sala já está reservada nesse horário.")
        self.periods = periods or []


class InvalidStatusTransitionError(ConflictError):
    def __init__(self, current: str, target: str) -> None:
        super().__init__(f"Uma reserva com status '{current}' não pode passar para '{target}'.")
        self.current = current
        self.target = target


class ReservationNotEditableError(ConflictError):
    def __init__(self) -> None:
        super().__init__("Apenas reservas pendentes podem ser editadas.")


class ReservationNotDeletableError(ConflictError):
    def __init__(self) -> None:
        super().__init__("Reservas aprovadas precisam ser canceladas antes de serem excluídas.")
