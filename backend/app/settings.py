import os
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

load_dotenv()

DEFAULT_TIMEZONE = "America/Sao_Paulo"


def get_timezone() -> ZoneInfo:
    return ZoneInfo(os.getenv("APP_TIMEZONE", DEFAULT_TIMEZONE))
