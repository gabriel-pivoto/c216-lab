from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.domain.errors import BusinessRuleError, ConflictError, NotFoundError


def _handler(status_code: int):
    def handle(_: Request, error: Exception) -> JSONResponse:
        return JSONResponse(status_code=status_code, content={"detail": str(error)})

    return handle


def register_error_handlers(application: FastAPI) -> None:
    application.add_exception_handler(NotFoundError, _handler(status.HTTP_404_NOT_FOUND))
    application.add_exception_handler(ConflictError, _handler(status.HTTP_409_CONFLICT))
    application.add_exception_handler(
        BusinessRuleError, _handler(status.HTTP_422_UNPROCESSABLE_CONTENT)
    )
