from datetime import date, datetime, time, timedelta


def next_week_at(hour: int, minute: int = 0) -> datetime:
    return datetime.combine(date.today() + timedelta(days=7), time(hour, minute))


def iso(moment: datetime) -> str:
    return moment.isoformat()
