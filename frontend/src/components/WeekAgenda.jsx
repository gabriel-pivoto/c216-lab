import {
  AGENDA_FIRST_HOUR,
  AGENDA_LAST_HOUR,
  agendaPosition,
  formatDate,
  formatTime,
} from "../utils/datetime.js";
import { RESERVATION_STATUS, STATUS_STYLES } from "../utils/labels.js";

const HOURS = Array.from(
  { length: AGENDA_LAST_HOUR - AGENDA_FIRST_HOUR },
  (_, index) => AGENDA_FIRST_HOUR + index,
);
const HOUR_HEIGHT_REM = 3;

export default function WeekAgenda({ days, reservations }) {
  const height = `${HOURS.length * HOUR_HEIGHT_REM}rem`;

  return (
    <div className="card overflow-x-auto p-0">
      <div className="grid min-w-[48rem] grid-cols-[3.5rem_repeat(7,1fr)]">
        <div className="border-b border-slate-200" />
        {days.map((day) => (
          <div
            key={day.date}
            className="border-b border-l border-slate-200 p-2 text-center text-xs font-medium text-slate-700"
          >
            {day.label}
            <br />
            {formatDate(day.date).slice(0, 5)}
          </div>
        ))}

        <div style={{ height }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              style={{ height: `${HOUR_HEIGHT_REM}rem` }}
              className="pr-2 text-right text-xs text-slate-500"
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day) => (
          <ul
            key={day.date}
            aria-label={`Reservas de ${formatDate(day.date)}`}
            className="relative border-l border-slate-200"
            style={{
              height,
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent calc(3rem - 1px), #e2e8f0 calc(3rem - 1px), #e2e8f0 3rem)",
            }}
          >
            {reservations
              .filter((reservation) => reservation.starts_at.startsWith(day.date))
              .map((reservation) => (
                <li
                  key={reservation.id}
                  className={`absolute inset-x-0.5 overflow-hidden rounded border p-1 text-xs ${STATUS_STYLES[reservation.status]}`}
                  style={agendaPosition(reservation.starts_at, reservation.ends_at)}
                  title={`${reservation.title} (${reservation.requester_name})`}
                >
                  <span className="block font-medium">{reservation.title}</span>
                  <span className="block">
                    {formatTime(reservation.starts_at)} às {formatTime(reservation.ends_at)}
                  </span>
                  <span className="sr-only">{RESERVATION_STATUS[reservation.status]}</span>
                </li>
              ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
