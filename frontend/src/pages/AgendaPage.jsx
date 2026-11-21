import { useCallback, useState } from "react";
import { listReservations } from "../api/reservations.js";
import { listRooms } from "../api/rooms.js";
import { EmptyState, Loading, Notice } from "../components/Feedback.jsx";
import Field from "../components/Field.jsx";
import WeekAgenda from "../components/WeekAgenda.jsx";
import { useResource } from "../hooks/useResource.js";
import { addDays, formatDate, startOfWeek, toDateInput, weekDays } from "../utils/datetime.js";

export default function AgendaPage() {
  const [selectedRoom, setSelectedRoom] = useState("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const rooms = useResource(useCallback(() => listRooms(), []));
  const roomId = selectedRoom || rooms.data?.[0]?.id || "";
  const days = weekDays(weekStart);
  const firstDay = days[0].date;
  const lastDay = days[6].date;

  const reservationsLoader = useCallback(
    () =>
      roomId
        ? listReservations({
            room_id: roomId,
            status: ["pending", "approved"],
            date_from: firstDay,
            date_to: lastDay,
          })
        : Promise.resolve([]),
    [roomId, firstDay, lastDay],
  );
  const reservations = useResource(reservationsLoader);

  const failure = rooms.error ?? reservations.error;

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end justify-between gap-4">
        <Field id="agenda-room" label="Sala">
          <select
            id="agenda-room"
            className="field-input min-w-56"
            value={roomId}
            onChange={(event) => setSelectedRoom(event.target.value)}
          >
            {rooms.data?.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setWeekStart((current) => addDays(current, -7))}
          >
            Semana anterior
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Hoje
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setWeekStart((current) => addDays(current, 7))}
          >
            Próxima semana
          </button>
        </div>
      </div>

      <h2 className="text-sm font-medium text-slate-700">
        Semana de {formatDate(firstDay)} a {formatDate(lastDay)}
        <span className="sr-only"> ({toDateInput(weekStart)})</span>
      </h2>

      <Notice notice={failure ? { type: "error", text: failure } : null} />
      {rooms.loading || (reservations.loading && !reservations.data) ? (
        <Loading>Carregando agenda...</Loading>
      ) : null}
      {rooms.data?.length === 0 ? (
        <EmptyState>Cadastre uma sala para ver a agenda.</EmptyState>
      ) : (
        <WeekAgenda days={days} reservations={reservations.data ?? []} />
      )}
    </div>
  );
}
