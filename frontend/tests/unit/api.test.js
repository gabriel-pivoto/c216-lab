import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_URL, ApiError, NO_CONNECTION_MESSAGE, request } from "../../src/services/api.js";

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function catchError(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("the promise should have been rejected");
}

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("request on success", () => {
  it("sends a GET to the API URL and returns the JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [{ id: 1 }]));

    await expect(request("/books")).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/books`, { method: "GET", headers: {} });
  });

  it("builds the query string skipping empty params", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));

    await request("/books", {
      params: { author: "Machado de Assis", limit: 100, empty: "", none: null },
    });

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_URL}/books?author=Machado+de+Assis&limit=100`);
  });

  it("sends the body as JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 7 }));

    await request("/books", { method: "POST", body: { title: "Dom Casmurro" } });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Dom Casmurro" }),
    });
  });

  it("returns null on 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(request("/books/1", { method: "DELETE" })).resolves.toBeNull();
  });
});

describe("request without a connection", () => {
  it("throws an ApiError with status 0 when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await catchError(request("/books"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toBe(NO_CONNECTION_MESSAGE);
  });
});

describe("request with an error response", () => {
  it("uses the FastAPI detail text", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: "Book 9 not found" }));

    const error = await catchError(request("/books/9"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Book 9 not found");
  });

  it("joins the validation errors (422) with each field name", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        detail: [
          { loc: ["body", "year"], msg: "Input should be less than or equal to 2100" },
          { loc: ["body", "price"], msg: "Input should be greater than 0" },
        ],
      }),
    );

    const error = await catchError(request("/books", { method: "POST", body: {} }));

    expect(error.status).toBe(422);
    expect(error.message).toBe(
      "year: Input should be less than or equal to 2100; price: Input should be greater than 0",
    );
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Internal Server Error", { status: 500 }));

    const error = await catchError(request("/books"));

    expect(error.status).toBe(500);
    expect(error.message).toBe("A API respondeu com erro 500.");
  });
});
