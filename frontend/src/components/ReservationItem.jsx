import { formatPeriod } from "../utils/datetime.js";
import { actionsFor, isActive, RESERVATION_STATUS, STATUS_STYLES } from "../utils/labels.js";

const ACTION_BUTTONS = {
  approve: { label: "Aprovar", style: "btn-primary" },
  reject: { label: "Rejeitar", style: "btn-secondary" },
  edit: { label: "Editar", style: "btn-secondary" },
  cancel: { label: "Cancelar", style: "btn-secondary" },
  delete: { label: "Excluir", style: "btn-danger" },
};

export default function ReservationItem({ reservation, roomName, actions = null, onAction }) {
  const available = actionsFor(reservation.status).filter(
    (action) => actions === null || actions.includes(action),
  );

  return (
    <li className="card flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">{reservation.title}</h3>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[reservation.status]}`}
          >
            {RESERVATION_STATUS[reservation.status]}
          </span>
          {reservation.series_id ? (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-800">
              Semanal
            </span>
          ) : null}
        </div>
        <p className="text-sm text-slate-600">
          {roomName} · {formatPeriod(reservation.starts_at, reservation.ends_at)}
        </p>
        <p className="text-xs text-slate-500">
          {reservation.requester_name} ({reservation.requester_email}) · {reservation.attendees}{" "}
          participantes
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((action) => (
          <button
            key={action}
            type="button"
            className={ACTION_BUTTONS[action].style}
            onClick={() => onAction(action, reservation)}
          >
            {ACTION_BUTTONS[action].label}
          </button>
        ))}
        {actions === null && reservation.series_id && isActive(reservation.status) ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onAction("cancel-series", reservation)}
          >
            Cancelar série
          </button>
        ) : null}
      </div>
    </li>
  );
}
