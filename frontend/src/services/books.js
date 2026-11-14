import { request } from "./api.js";

const RESOURCE = "/books";

export const MAX_LIMIT = 100;

export function listBooks({ author, limit = MAX_LIMIT } = {}) {
  return request(RESOURCE, { params: { author: author?.trim(), limit } });
}

export function getBook(id) {
  return request(`${RESOURCE}/${id}`);
}

export function createBook(data) {
  return request(RESOURCE, { method: "POST", body: data });
}

export function replaceBook(id, data) {
  return request(`${RESOURCE}/${id}`, { method: "PUT", body: data });
}

export function updateBook(id, changes) {
  return request(`${RESOURCE}/${id}`, { method: "PATCH", body: changes });
}

export function deleteBook(id) {
  return request(`${RESOURCE}/${id}`, { method: "DELETE" });
}
