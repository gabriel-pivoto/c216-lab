export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

export const NO_CONNECTION_MESSAGE =
  "Não foi possível conectar à API. Verifique se o backend está rodando.";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildUrl(path, params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return `${API_URL}${path}${query ? `?${query}` : ""}`;
}

function messageFromDetail(detail) {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map(({ loc = [], msg }) => {
        const field = loc.filter((part) => part !== "body").join(".");
        return field ? `${field}: ${msg}` : msg;
      })
      .join("; ");
  }
  return null;
}

async function readError(response) {
  const fallback = `A API respondeu com erro ${response.status}.`;
  try {
    const body = await response.json();
    return messageFromDetail(body?.detail) || fallback;
  } catch {
    return fallback;
  }
}

export async function request(path, { method = "GET", body, params } = {}) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildUrl(path, params), options);
  } catch {
    throw new ApiError(NO_CONNECTION_MESSAGE, 0);
  }

  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}
