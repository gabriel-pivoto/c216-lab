from fastapi import FastAPI

from app.api.errors import register_error_handlers
from app.api.router import api_router


def create_app() -> FastAPI:
    application = FastAPI(title="SalaCerta API")
    register_error_handlers(application)
    application.include_router(api_router)
    return application


app = create_app()
