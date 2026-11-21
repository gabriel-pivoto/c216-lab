import { useState } from "react";
import { ROOM_KINDS } from "../utils/labels.js";
import { hasErrors, MAX_ROOM_CAPACITY, normalizeRoom, validateRoom } from "../utils/validation.js";
import { Alert } from "./Feedback.jsx";
import Field from "./Field.jsx";
import ResourceCheckboxes from "./ResourceCheckboxes.jsx";

const EMPTY_ROOM = { name: "", kind: "classroom", location: "", capacity: "", resources: [] };

function toValues(room) {
  return room ? { ...room, capacity: String(room.capacity) } : EMPTY_ROOM;
}

export default function RoomForm({ room, onSubmit, onCancel }) {
  const [values, setValues] = useState(toValues(room));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleChange(event) {
    setField(event.target.name, event.target.value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateRoom(values);
    setErrors(validation);
    setSubmitError(null);
    if (hasErrors(validation)) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(normalizeRoom(values));
      if (!room) {
        setValues(EMPTY_ROOM);
      }
    } catch (failure) {
      setSubmitError(failure.message);
    } finally {
      setSubmitting(false);
    }
  }

  const title = room ? `Editar ${room.name}` : "Nova sala";

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={title} className="card space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <Field id="room-name" label="Nome" error={errors.name}>
        <input
          id="room-name"
          name="name"
          className="field-input"
          value={values.name}
          onChange={handleChange}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="room-kind" label="Tipo">
          <select
            id="room-kind"
            name="kind"
            className="field-input"
            value={values.kind}
            onChange={handleChange}
          >
            {Object.entries(ROOM_KINDS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="room-capacity" label="Capacidade" error={errors.capacity}>
          <input
            id="room-capacity"
            name="capacity"
            type="number"
            min="1"
            max={MAX_ROOM_CAPACITY}
            className="field-input"
            value={values.capacity}
            onChange={handleChange}
          />
        </Field>
      </div>
      <Field id="room-location" label="Localização" error={errors.location}>
        <input
          id="room-location"
          name="location"
          className="field-input"
          value={values.location}
          onChange={handleChange}
        />
      </Field>
      <ResourceCheckboxes
        selected={values.resources}
        onChange={(resources) => setField("resources", resources)}
      />
      <Alert>{submitError}</Alert>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar sala"}
        </button>
        {room ? (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar edição
          </button>
        ) : null}
      </div>
    </form>
  );
}
