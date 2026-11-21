import { ROOM_KINDS, ROOM_RESOURCES } from "../utils/labels.js";

export default function RoomCard({ room, children }) {
  return (
    <li className="card flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h3 className="font-semibold text-slate-900">{room.name}</h3>
        <p className="text-sm text-slate-600">
          {ROOM_KINDS[room.kind]} · {room.location} · {room.capacity} pessoas
        </p>
        <p className="text-xs text-slate-500">
          {room.resources.length > 0
            ? room.resources.map((resource) => ROOM_RESOURCES[resource]).join(", ")
            : "Sem recursos cadastrados"}
        </p>
      </div>
      <div className="flex gap-2">{children}</div>
    </li>
  );
}
