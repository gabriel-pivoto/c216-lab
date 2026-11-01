import { vi } from "vitest";

function jsonResponse(status, body) {
  return new Response(status === 204 ? null : JSON.stringify(body), { status });
}

export function mockApi(routes) {
  const calls = [];
  const fetchMock = vi.fn(async (url, options = {}) => {
    const { pathname, searchParams } = new URL(url);
    const method = options.method ?? "GET";
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ method, pathname, searchParams, body });

    const handler = routes[`${method} ${pathname}`];
    if (!handler) {
      return jsonResponse(404, { detail: `Rota não mockada: ${method} ${pathname}` });
    }
    const [status, payload] =
      typeof handler === "function" ? handler({ body, searchParams }) : handler;
    return jsonResponse(status, payload);
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

export const ROOM = {
  id: 1,
  name: "Laboratório 3",
  kind: "laboratory",
  location: "Prédio 2",
  capacity: 30,
  resources: ["projector"],
};

export const RESERVATION = {
  id: 7,
  room_id: 1,
  title: "Aula de redes",
  requester_name: "Ana Souza",
  requester_email: "ana@example.com",
  attendees: 20,
  starts_at: "2030-03-11T10:00:00",
  ends_at: "2030-03-11T12:00:00",
  status: "pending",
  series_id: null,
  created_at: "2030-03-01T10:00:00Z",
};
