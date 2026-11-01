import os

from dotenv import load_dotenv

load_dotenv()


class MissingDatabaseUrlError(RuntimeError):
    def __init__(self) -> None:
        super().__init__("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise MissingDatabaseUrlError
    return url
