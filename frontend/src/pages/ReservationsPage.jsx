import { useCallback, useState } from "react";
import {
  cancelSeries,
  changeReservationStatus,
  createRecurringReservation,
  createReservation,
  deleteReservation,
  listReservations,
  updateReservation,
} from "../api/reservations.js";
import { listRooms } from "../api/rooms.js";
import { EmptyState, Loading, Notice } from "../components/Feedback.jsx";
import Field from "../components/Field.jsx";
import ReservationForm from "../components/ReservationForm.jsx";
import ReservationItem from "../components/ReservationItem.jsx";
import { useResource } from "../hooks/useResource.js";
import { splitDateTime } from "../utils/datetime.js";
import { RESERVATION_STATUS } from "../utils/labels.js";

const SUCCESS_MESSAGES = {
  approve: "Reserva aprovada.",
  reject: "Reserva rejeitada.",
  cancel: "Reserva cancelada.",
};

function toFormValues(reservation) {
  const start = splitDateTime(reservation.starts_at);
  return {
    room_id: String(reservation.room_id),
    title: reservation.title,
    requester_name: reservation.requester_name,
    requester_email: reservation.requester_email,
    attendees: String(reservation.attendees),
    date: start.date,
    start_time: start.time,
    end_time: splitDateTime(reservation.ends_at).time,
  };
}

export default function ReservationsPage({ prefill }) {
  const [status, setStatus] = useState("");
  const [roomId, setRoomId] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [email, setEmail] = useState("");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);

  const roomsResource = useResource(useCallback(() => listRooms(), []));
  const reservationsLoader = useCallback(
    () => listReservations({ status, room_id: roomId, requester_email: email }),
    [status, roomId, email],
  );
  const { data: reservations, error, loading, reload } = useResource(reservationsLoader);

  const rooms = roomsResource.data ?? [];
  const roomNames = Object.fromEntries(rooms.map((room) => [room.id, room.name]));

  async function handleSubmit(values) {
    if (editing) {
      await updateReservation(editing.id, values);
      setNotice({ type: "success", text: "Reserva atualizada." });
      setEditing(null);
    } else if (values.weeks) {
      const created = await createRecurringReservation(values);
      setNotice({ type: "success", text: `${created.length} reservas semanais criadas.` });
    } else {
      await createReservation(values);
      setNotice({ type: "success", text: "Reserva criada e aguardando aprovação." });
    }
    reload();
  }

  async function runAction(action, reservation) {
    if (action === "delete") {
      await deleteReservation(reservation.id);
      setNotice({ type: "success", text: "Reserva excluída." });
    } else if (action === "cancel-series") {
      await cancelSeries(reservation.series_id);
      setNotice({ type: "success", text: "Série cancelada." });
    } else {
      await changeReservationStatus(reservation.id, action);
      setNotice({ type: "success", text: SUCCESS_MESSAGES[action] });
    }
    if (editing?.id === reservation.id) {
      setEditing(null);
    }
    reload();
  }

  async function handleAction(action, reservation) {
    if (action === "edit") {
      setEditing(reservation);
      return;
    }
    if (action === "delete" && !window.confirm(`Excluir a reserva ${reservation.title}?`)) {
      return;
    }
    if (action === "cancel-series" && !window.confirm("Cancelar as próximas reservas da série?")) {
      return;
    }
    try {
      await runAction(action, reservation);
    } catch (failure) {
      setNotice({ type: "error", text: failure.message });
    }
  }

  function handleEmailFilter(event) {
    event.preventDefault();
    setEmail(emailInput.trim());
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[24rem_1fr]">
      <ReservationForm
        key={editing?.id ?? "new"}
        rooms={rooms}
        initial={editing ? toFormValues(editing) : prefill}
        editing={Boolean(editing)}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />

      <section aria-label="Reservas" className="space-y-4">
        <form onSubmit={handleEmailFilter} className="card grid items-end gap-3 sm:grid-cols-4">
          <Field id="filter-status" label="Status">
            <select
              id="filter-status"
              className="field-input"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(RESERVATION_STATUS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="filter-room" label="Filtrar por sala">
            <select
              id="filter-room"
              className="field-input"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
            >
              <option value="">Todas</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="filter-email" label="E-mail do solicitante">
            <input
              id="filter-email"
              type="email"
              className="field-input"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
            />
          </Field>
          <button type="submit" className="btn-secondary">
            Filtrar
          </button>
        </form>

        <Notice notice={notice} />
        <Notice notice={error ? { type: "error", text: error } : null} />
        <Notice
          notice={roomsResource.error ? { type: "error", text: roomsResource.error } : null}
        />
        {loading && !reservations ? <Loading>Carregando reservas...</Loading> : null}
        {reservations?.length === 0 ? <EmptyState>Nenhuma reserva encontrada.</EmptyState> : null}

        <ul aria-label="Reservas cadastradas" className="space-y-3">
          {reservations?.map((reservation) => (
            <ReservationItem
              key={reservation.id}
              reservation={reservation}
              roomName={roomNames[reservation.room_id] ?? `Sala ${reservation.room_id}`}
              onAction={handleAction}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
