export const ROOM_KINDS = {
  classroom: "Sala de aula",
  laboratory: "Laboratório",
  auditorium: "Auditório",
  meeting_room: "Sala de reunião",
};

export const ROOM_RESOURCES = {
  projector: "Projetor",
  computers: "Computadores",
  air_conditioning: "Ar-condicionado",
  whiteboard: "Quadro branco",
  video_conference: "Videoconferência",
};

export const RESERVATION_STATUS = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
  cancelled: "Cancelada",
};

export const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  approved: "bg-emerald-100 text-emerald-900 border-emerald-300",
  rejected: "bg-red-100 text-red-900 border-red-300",
  cancelled: "bg-slate-100 text-slate-700 border-slate-300",
};

const STATUS_ACTIONS = {
  pending: ["approve", "reject", "edit", "cancel", "delete"],
  approved: ["cancel"],
  rejected: ["delete"],
  cancelled: ["delete"],
};

export function actionsFor(status) {
  return STATUS_ACTIONS[status] ?? [];
}

export function isActive(status) {
  return status === "pending" || status === "approved";
}
