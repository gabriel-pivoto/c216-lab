import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, request } from "../../src/api/client.js";
import { mockApi } from "../helpers/mockApi.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("request", () => {
  it("sends the query params, repeating lists and skipping empty values", async () => {
    const calls = mockApi({ "GET /rooms": [200, []] });

    await request("/rooms", { params: { kind: "", resource: ["a", "b"], min_capacity: 5 } });

    expect(calls[0].searchParams.getAll("resource")).toEqual(["a", "b"]);
    expect(calls[0].searchParams.get("min_capacity")).toBe("5");
    expect(calls[0].searchParams.has("kind")).toBe(false);
  });

  it("sends the body as JSON", async () => {
    const calls = mockApi({ "POST /rooms": [201, { id: 1 }] });

    await expect(request("/rooms", { method: "POST", body: { name: "A" } })).resolves.toEqual({
      id: 1,
    });
    expect(calls[0].body).toEqual({ name: "A" });
  });

  it("returns null for a response without content", async () => {
    mockApi({ "DELETE /rooms/1": [204] });

    await expect(request("/rooms/1", { method: "DELETE" })).resolves.toBeNull();
  });

  it("uses the message sent by the API", async () => {
    mockApi({ "POST /rooms": [409, { detail: "Já existe" }] });

    const failure = await request("/rooms", { method: "POST", body: {} }).catch((e) => e);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure.status).toBe(409);
    expect(failure.message).toBe("Já existe");
  });

  it("joins the validation errors sent by FastAPI", async () => {
    mockApi({
      "POST /rooms": [422, { detail: [{ loc: ["body", "capacity"], msg: "too small" }] }],
    });

    await expect(request("/rooms", { method: "POST", body: {} })).rejects.toThrow(
      "capacity: too small",
    );
  });

  it("explains connection failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(request("/rooms")).rejects.toThrow("Não foi possível conectar à API");
  });
});
