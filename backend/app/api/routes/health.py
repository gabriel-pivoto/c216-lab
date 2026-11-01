from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def status():
    return {"status": "ok"}
