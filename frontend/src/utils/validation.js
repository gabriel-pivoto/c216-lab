import { combineDateTime } from "./datetime.js";

export const MAX_ROOM_CAPACITY = 1000;
export const MIN_WEEKS = 2;
export const MAX_WEEKS = 12;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

function isIntegerBetween(value, min, max) {
  const number = Number(value);
  return value !== "" && Number.isInteger(number) && number >= min && number <= max;
}

export function validateRoom(values) {
  const errors = {};
  if (!values.name.trim()) {
    errors.name = "Informe o nome da sala.";
  } else if (values.name.trim().length > 100) {
    errors.name = "O nome deve ter até 100 caracteres.";
  }
  if (!values.location.trim()) {
    errors.location = "Informe a localização.";
  } else if (values.location.trim().length > 120) {
    errors.location = "A localização deve ter até 120 caracteres.";
  }
  if (!isIntegerBetween(values.capacity, 1, MAX_ROOM_CAPACITY)) {
    errors.capacity = `A capacidade deve ser um número inteiro de 1 a ${MAX_ROOM_CAPACITY}.`;
  }
  return errors;
}

export function normalizeRoom(values) {
  return {
    name: values.name.trim(),
    kind: values.kind,
    location: values.location.trim(),
    capacity: Number(values.capacity),
    resources: values.resources,
  };
}

export function validateReservation(values) {
  const errors = {};
  if (!values.room_id) {
    errors.room_id = "Selecione uma sala.";
  }
  if (!values.title.trim()) {
    errors.title = "Informe o título.";
  } else if (values.title.trim().length > 120) {
    errors.title = "O título deve ter até 120 caracteres.";
  }
  if (!values.requester_name.trim()) {
    errors.requester_name = "Informe o nome do solicitante.";
  }
  if (!EMAIL_PATTERN.test(values.requester_email.trim())) {
    errors.requester_email = "Informe um e-mail válido.";
  }
  if (!isIntegerBetween(values.attendees, 1, MAX_ROOM_CAPACITY)) {
    errors.attendees = "Informe o número de participantes.";
  }
  if (!values.date) {
    errors.date = "Informe a data.";
  }
  if (!values.start_time) {
    errors.start_time = "Informe o início.";
  }
  if (!values.end_time) {
    errors.end_time = "Informe o término.";
  } else if (values.start_time && values.end_time <= values.start_time) {
    errors.end_time = "O término deve ser depois do início.";
  }
  if (values.recurring && !isIntegerBetween(values.weeks, MIN_WEEKS, MAX_WEEKS)) {
    errors.weeks = `Informe de ${MIN_WEEKS} a ${MAX_WEEKS} semanas.`;
  }
  return errors;
}

export function normalizeReservation(values) {
  return {
    room_id: Number(values.room_id),
    title: values.title.trim(),
    requester_name: values.requester_name.trim(),
    requester_email: values.requester_email.trim(),
    attendees: Number(values.attendees),
    starts_at: combineDateTime(values.date, values.start_time),
    ends_at: combineDateTime(values.date, values.end_time),
    ...(values.recurring ? { weeks: Number(values.weeks) } : {}),
  };
}
