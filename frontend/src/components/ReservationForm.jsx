import { useState } from "react";
import {
  hasErrors,
  MAX_WEEKS,
  MIN_WEEKS,
  normalizeReservation,
  validateReservation,
} from "../utils/validation.js";
import { Alert } from "./Feedback.jsx";
import Field from "./Field.jsx";

const EMPTY_VALUES = {
  room_id: "",
  title: "",
  requester_name: "",
  requester_email: "",
  attendees: "",
  date: "",
  start_time: "",
  end_time: "",
  recurring: false,
  weeks: "4",
};

export default function ReservationForm({ rooms, initial, editing, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY_VALUES, ...initial });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateReservation(values);
    setErrors(validation);
    setSubmitError(null);
    if (hasErrors(validation)) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(normalizeReservation(values));
      if (!editing) {
        setValues(EMPTY_VALUES);
      }
    } catch (failure) {
      setSubmitError(failure.message);
    } finally {
      setSubmitting(false);
    }
  }

  const title = editing ? "Editar reserva" : "Nova reserva";

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={title} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">
          Entre 07:00 e 23:00, com duração de 30 minutos a 4 horas.
        </p>
      </div>
      <Field id="reservation-room" label="Sala" error={errors.room_id}>
        <select
          id="reservation-room"
          name="room_id"
          className="field-input"
          value={values.room_id}
          onChange={handleChange}
        >
          <option value="">Selecione</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} ({room.capacity} pessoas)
            </option>
          ))}
        </select>
      </Field>
      <Field id="reservation-title" label="Título" error={errors.title}>
        <input
          id="reservation-title"
          name="title"
          className="field-input"
          value={values.title}
          onChange={handleChange}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="reservation-requester" label="Solicitante" error={errors.requester_name}>
          <input
            id="reservation-requester"
            name="requester_name"
            className="field-input"
            value={values.requester_name}
            onChange={handleChange}
          />
        </Field>
        <Field id="reservation-email" label="E-mail" error={errors.requester_email}>
          <input
            id="reservation-email"
            name="requester_email"
            type="email"
            className="field-input"
            value={values.requester_email}
            onChange={handleChange}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field id="reservation-attendees" label="Participantes" error={errors.attendees}>
          <input
            id="reservation-attendees"
            name="attendees"
            type="number"
            min="1"
            className="field-input"
            value={values.attendees}
            onChange={handleChange}
          />
        </Field>
        <Field id="reservation-date" label="Data" error={errors.date}>
          <input
            id="reservation-date"
            name="date"
            type="date"
            className="field-input"
            value={values.date}
            onChange={handleChange}
          />
        </Field>
        <Field id="reservation-start" label="Início" error={errors.start_time}>
          <input
            id="reservation-start"
            name="start_time"
            type="time"
            className="field-input"
            value={values.start_time}
            onChange={handleChange}
          />
        </Field>
        <Field id="reservation-end" label="Término" error={errors.end_time}>
          <input
            id="reservation-end"
            name="end_time"
            type="time"
            className="field-input"
            value={values.end_time}
            onChange={handleChange}
          />
        </Field>
      </div>
      {editing ? null : (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="recurring"
              checked={values.recurring}
              onChange={handleChange}
            />
            Repetir semanalmente
          </label>
          {values.recurring ? (
            <Field id="reservation-weeks" label="Número de semanas" error={errors.weeks}>
              <input
                id="reservation-weeks"
                name="weeks"
                type="number"
                min={MIN_WEEKS}
                max={MAX_WEEKS}
                className="field-input"
                value={values.weeks}
                onChange={handleChange}
              />
            </Field>
          ) : null}
        </div>
      )}
      <Alert>{submitError}</Alert>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar reserva"}
        </button>
        {editing ? (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar edição
          </button>
        ) : null}
      </div>
    </form>
  );
}
