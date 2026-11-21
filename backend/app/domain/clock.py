from datetime import datetime

from app.settings import get_timezone


def local_now() -> datetime:
    return datetime.now(get_timezone()).replace(tzinfo=None)
