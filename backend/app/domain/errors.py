class DomainError(Exception):
    pass


class NotFoundError(DomainError):
    pass


class ConflictError(DomainError):
    pass


class RoomNotFoundError(NotFoundError):
    def __init__(self, room_id: int) -> None:
        super().__init__(f"Sala {room_id} não encontrada.")
        self.room_id = room_id


class RoomNameConflictError(ConflictError):
    def __init__(self, name: str) -> None:
        super().__init__(f"Já existe uma sala chamada '{name}'.")
        self.name = name
