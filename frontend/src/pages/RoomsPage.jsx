import { useCallback, useState } from "react";
import { createRoom, deleteRoom, listRooms, updateRoom } from "../api/rooms.js";
import { EmptyState, Loading, Notice } from "../components/Feedback.jsx";
import Field from "../components/Field.jsx";
import RoomCard from "../components/RoomCard.jsx";
import RoomForm from "../components/RoomForm.jsx";
import { useResource } from "../hooks/useResource.js";
import { ROOM_KINDS } from "../utils/labels.js";

export default function RoomsPage() {
  const [kind, setKind] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);

  const loader = useCallback(
    () => listRooms({ kind, min_capacity: Number(minCapacity) > 0 ? minCapacity : "" }),
    [kind, minCapacity],
  );
  const { data: rooms, error, loading, reload } = useResource(loader);

  async function handleSubmit(values) {
    if (editing) {
      await updateRoom(editing.id, values);
      setNotice({ type: "success", text: `Sala ${values.name} atualizada.` });
      setEditing(null);
    } else {
      await createRoom(values);
      setNotice({ type: "success", text: `Sala ${values.name} cadastrada.` });
    }
    reload();
  }

  async function handleDelete(room) {
    if (!window.confirm(`Excluir a sala ${room.name}?`)) {
      return;
    }
    try {
      await deleteRoom(room.id);
      setNotice({ type: "success", text: `Sala ${room.name} excluída.` });
      if (editing?.id === room.id) {
        setEditing(null);
      }
      reload();
    } catch (failure) {
      setNotice({ type: "error", text: failure.message });
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
      <RoomForm
        key={editing?.id ?? "new"}
        room={editing}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />

      <section aria-label="Salas" className="space-y-4">
        <div className="card grid gap-3 sm:grid-cols-2">
          <Field id="filter-kind" label="Filtrar por tipo">
            <select
              id="filter-kind"
              className="field-input"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(ROOM_KINDS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="filter-capacity" label="Capacidade mínima">
            <input
              id="filter-capacity"
              type="number"
              min="1"
              className="field-input"
              value={minCapacity}
              onChange={(event) => setMinCapacity(event.target.value)}
            />
          </Field>
        </div>

        <Notice notice={notice} />
        <Notice notice={error ? { type: "error", text: error } : null} />
        {loading && !rooms ? <Loading>Carregando salas...</Loading> : null}
        {rooms?.length === 0 ? <EmptyState>Nenhuma sala encontrada.</EmptyState> : null}

        <ul aria-label="Salas cadastradas" className="space-y-3">
          {rooms?.map((room) => (
            <RoomCard key={room.id} room={room}>
              <button type="button" className="btn-secondary" onClick={() => setEditing(room)}>
                Editar
              </button>
              <button type="button" className="btn-danger" onClick={() => handleDelete(room)}>
                Excluir
              </button>
            </RoomCard>
          ))}
        </ul>
      </section>
    </div>
  );
}
