import { request } from "./client.js";

export function listReservations(filters = {}) {
  return request("/reservations", { params: filters });
}

export function createReservation(reservation) {
  return request("/reservations", { method: "POST", body: reservation });
}

export function createRecurringReservation(reservation) {
  return request("/reservations/recurring", { method: "POST", body: reservation });
}

export function updateReservation(id, reservation) {
  return request(`/reservations/${id}`, { method: "PUT", body: reservation });
}

export function changeReservationStatus(id, action) {
  return request(`/reservations/${id}/${action}`, { method: "POST" });
}

export function cancelSeries(seriesId) {
  return request(`/reservations/series/${seriesId}/cancel`, { method: "POST" });
}

export function deleteReservation(id) {
  return request(`/reservations/${id}`, { method: "DELETE" });
}
