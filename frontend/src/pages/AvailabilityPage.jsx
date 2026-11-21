import { useState } from "react";
import { findAvailableRooms } from "../api/rooms.js";
import { EmptyState, Loading, Notice } from "../components/Feedback.jsx";
import Field from "../components/Field.jsx";
import ResourceCheckboxes from "../components/ResourceCheckboxes.jsx";
import RoomCard from "../components/RoomCard.jsx";
import { combineDateTime } from "../utils/datetime.js";
import { ROOM_KINDS } from "../utils/labels.js";

const EMPTY_SEARCH = {
  date: "",
  start_time: "",
  end_time: "",
  attendees: "",
  kind: "",
  resources: [],
};

export default function AvailabilityPage({ onReserve }) {
  const [values, setValues] = useState(EMPTY_SEARCH);
  const [rooms, setRooms] = useState(null);
  const [searched, setSearched] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (!values.date || !values.start_time || !values.end_time) {
      setError("Informe a data, o início e o término.");
      return;
    }
    setLoading(true);
    try {
      const found = await findAvailableRooms({
        starts_at: combineDateTime(values.date, values.start_time),
        ends_at: combineDateTime(values.date, values.end_time),
        attendees: values.attendees,
        kind: values.kind,
        resource: values.resources,
      });
      setRooms(found);
      setSearched(values);
    } catch (failure) {
      setRooms(null);
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Buscar salas livres"
        className="card space-y-4"
      >
        <h2 className="text-lg font-semibold text-slate-900">Buscar salas livres</h2>
        <Field id="search-date" label="Data">
          <input
            id="search-date"
            name="date"
            type="date"
            className="field-input"
            value={values.date}
            onChange={handleChange}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="search-start" label="Início">
            <input
              id="search-start"
              name="start_time"
              type="time"
              className="field-input"
              value={values.start_time}
              onChange={handleChange}
            />
          </Field>
          <Field id="search-end" label="Término">
            <input
              id="search-end"
              name="end_time"
              type="time"
              className="field-input"
              value={values.end_time}
              onChange={handleChange}
            />
          </Field>
          <Field id="search-attendees" label="Participantes">
            <input
              id="search-attendees"
              name="attendees"
              type="number"
              min="1"
              className="field-input"
              value={values.attendees}
              onChange={handleChange}
            />
          </Field>
          <Field id="search-kind" label="Tipo">
            <select
              id="search-kind"
              name="kind"
              className="field-input"
              value={values.kind}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              {Object.entries(ROOM_KINDS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <ResourceCheckboxes
          selected={values.resources}
          onChange={(resources) => setValues((current) => ({ ...current, resources }))}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      <section aria-label="Resultado da busca" className="space-y-4">
        <Notice notice={error ? { type: "error", text: error } : null} />
        {loading ? <Loading>Buscando salas...</Loading> : null}
        {rooms === null && !error && !loading ? (
          <EmptyState>Informe um período para ver as salas livres.</EmptyState>
        ) : null}
        {rooms?.length === 0 ? (
          <EmptyState>Nenhuma sala livre com esses critérios.</EmptyState>
        ) : null}
        <ul aria-label="Salas livres" className="space-y-3">
          {rooms?.map((room) => (
            <RoomCard key={room.id} room={room}>
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  onReserve({
                    room_id: String(room.id),
                    attendees: searched.attendees,
                    date: searched.date,
                    start_time: searched.start_time,
                    end_time: searched.end_time,
                  })
                }
              >
                Reservar
              </button>
            </RoomCard>
          ))}
        </ul>
      </section>
    </div>
  );
}
