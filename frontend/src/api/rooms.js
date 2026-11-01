import { request } from "./client.js";

export function listRooms(filters = {}) {
  return request("/rooms", { params: filters });
}

export function findAvailableRooms(filters) {
  return request("/rooms/available", { params: filters });
}

export function createRoom(room) {
  return request("/rooms", { method: "POST", body: room });
}

export function updateRoom(id, room) {
  return request(`/rooms/${id}`, { method: "PUT", body: room });
}

export function deleteRoom(id) {
  return request(`/rooms/${id}`, { method: "DELETE" });
}
