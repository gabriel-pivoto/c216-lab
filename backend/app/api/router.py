from fastapi import APIRouter

from app.api.routes import health, reservations, rooms

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(rooms.router)
api_router.include_router(reservations.router)
