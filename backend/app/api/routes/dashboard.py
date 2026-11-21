from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.dashboard import DashboardRepository
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard import DashboardService


def get_dashboard_service(db: Annotated[Session, Depends(get_db)]) -> DashboardService:
    return DashboardService(DashboardRepository(db))


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(service: Annotated[DashboardService, Depends(get_dashboard_service)]):
    return service.get_summary()
