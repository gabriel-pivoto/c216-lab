import { useCallback, useState } from "react";
import { getDashboardSummary } from "../api/dashboard.js";
import { changeReservationStatus, listReservations } from "../api/reservations.js";
import { listRooms } from "../api/rooms.js";
import { EmptyState, Loading, Notice } from "../components/Feedback.jsx";
import ReservationItem from "../components/ReservationItem.jsx";
import { useResource } from "../hooks/useResource.js";
import { toDateInput } from "../utils/datetime.js";

const PENDING_LIMIT = 5;

function loadDashboard() {
  return Promise.all([
    getDashboardSummary(),
    listReservations({
      status: "pending",
      date_from: toDateInput(new Date()),
      limit: PENDING_LIMIT,
    }),
    listRooms(),
  ]).then(([summary, pending, rooms]) => ({ summary, pending, rooms }));
}

function StatCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [notice, setNotice] = useState(null);
  const { data, error, loading, reload } = useResource(useCallback(() => loadDashboard(), []));

  async function handleAction(action, reservation) {
    try {
      await changeReservationStatus(reservation.id, action);
      setNotice({
        type: "success",
        text: action === "approve" ? "Reserva aprovada." : "Reserva rejeitada.",
      });
      reload();
    } catch (failure) {
      setNotice({ type: "error", text: failure.message });
    }
  }

  if (loading && !data) {
    return <Loading>Carregando painel...</Loading>;
  }
  if (!data) {
    return <Notice notice={{ type: "error", text: error }} />;
  }

  const { summary, pending, rooms } = data;
  const roomNames = Object.fromEntries(rooms.map((room) => [room.id, room.name]));

  return (
    <div className="space-y-6">
      <Notice notice={notice} />
      <Notice notice={error ? { type: "error", text: error } : null} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Salas" value={summary.total_rooms} />
        <StatCard label="Pendentes" value={summary.pending_reservations} />
        <StatCard label="Reservas hoje" value={summary.reservations_today} />
        <StatCard label="Aprovadas em 7 dias" value={summary.approved_next_7_days} />
        <StatCard label="Ocupação hoje" value={`${summary.occupancy_today_percent}%`} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-label="Aguardando aprovação" className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Aguardando aprovação</h2>
          {pending.length === 0 ? <EmptyState>Nenhuma reserva pendente.</EmptyState> : null}
          <ul className="space-y-3">
            {pending.map((reservation) => (
              <ReservationItem
                key={reservation.id}
                reservation={reservation}
                roomName={roomNames[reservation.room_id]}
                actions={["approve", "reject"]}
                onAction={handleAction}
              />
            ))}
          </ul>
        </section>

        <section aria-label="Salas mais usadas" className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Salas mais usadas</h2>
          <p className="text-xs text-slate-500">
            Reservas aprovadas, 30 dias antes e depois de hoje.
          </p>
          {summary.busiest_rooms.length === 0 ? (
            <EmptyState>Ainda não há reservas aprovadas.</EmptyState>
          ) : (
            <div className="card">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-2 font-medium">Sala</th>
                    <th className="pb-2 font-medium">Reservas</th>
                    <th className="pb-2 font-medium">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.busiest_rooms.map((room) => (
                    <tr key={room.room_id} className="border-t border-slate-100">
                      <td className="py-2 text-slate-900">{room.room_name}</td>
                      <td className="py-2">{room.reservations}</td>
                      <td className="py-2">{room.hours.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
