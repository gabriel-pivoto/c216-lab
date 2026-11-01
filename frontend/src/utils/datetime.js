export const AGENDA_FIRST_HOUR = 7;
export const AGENDA_LAST_HOUR = 23;

const AGENDA_MINUTES = (AGENDA_LAST_HOUR - AGENDA_FIRST_HOUR) * 60;
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function pad(value) {
  return String(value).padStart(2, "0");
}

export function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function combineDateTime(date, time) {
  return `${date}T${time}:00`;
}

export function splitDateTime(value) {
  return { date: value.slice(0, 10), time: value.slice(11, 16) };
}

export function formatDate(value) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatTime(value) {
  return value.slice(11, 16);
}

export function formatPeriod(startsAt, endsAt) {
  return `${formatDate(startsAt)}, ${formatTime(startsAt)} às ${formatTime(endsAt)}`;
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function startOfWeek(date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

export function weekDays(weekStart) {
  return WEEKDAYS.map((label, index) => {
    const date = addDays(weekStart, index);
    return { label, date: toDateInput(date) };
  });
}

function minutesSinceOpening(value) {
  const [hours, minutes] = formatTime(value).split(":").map(Number);
  return (hours - AGENDA_FIRST_HOUR) * 60 + minutes;
}

export function agendaPosition(startsAt, endsAt) {
  const start = minutesSinceOpening(startsAt);
  const end = minutesSinceOpening(endsAt);
  return {
    top: `${(start / AGENDA_MINUTES) * 100}%`,
    height: `${((end - start) / AGENDA_MINUTES) * 100}%`,
  };
}
