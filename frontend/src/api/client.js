const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function describeDetail(detail) {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((item) => `${item.loc?.at(-1) ?? "campo"}: ${item.msg}`).join("; ");
  }
  return "Não foi possível concluir a operação.";
}

function buildUrl(path, params = {}) {
  const url = new URL(path, API_URL);
  for (const [key, value] of Object.entries(params)) {
    for (const item of [value].flat()) {
      if (item !== undefined && item !== null && item !== "") {
        url.searchParams.append(key, item);
      }
    }
  }
  return url;
}

export async function request(path, { method = "GET", body, params } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Não foi possível conectar à API. Verifique se ela está no ar.", 0);
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(describeDetail(payload?.detail), response.status);
  }
  return payload;
}
