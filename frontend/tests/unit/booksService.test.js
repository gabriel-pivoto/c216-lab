import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../../src/services/api.js";
import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  MAX_LIMIT,
  replaceBook,
  updateBook,
} from "../../src/services/books.js";

vi.mock("../../src/services/api.js", () => ({ request: vi.fn() }));

const data = {
  title: "Dom Casmurro",
  author: "Machado de Assis",
  year: 1899,
  pages: 256,
  genre: "Romance",
  price: 39.9,
};

beforeEach(() => {
  vi.mocked(request).mockReset();
  vi.mocked(request).mockResolvedValue("response");
});

describe("books service", () => {
  it("listBooks uses the max limit and no author by default", async () => {
    await expect(listBooks()).resolves.toBe("response");

    expect(request).toHaveBeenCalledWith("/books", {
      params: { author: undefined, limit: MAX_LIMIT },
    });
  });

  it("listBooks trims the author", async () => {
    await listBooks({ author: "  George Orwell ", limit: 5 });

    expect(request).toHaveBeenCalledWith("/books", {
      params: { author: "George Orwell", limit: 5 },
    });
  });

  it("getBook sends a GET to /books/{id}", async () => {
    await getBook(3);

    expect(request).toHaveBeenCalledWith("/books/3");
  });

  it("createBook sends a POST to /books", async () => {
    await createBook(data);

    expect(request).toHaveBeenCalledWith("/books", { method: "POST", body: data });
  });

  it("replaceBook sends a PUT to /books/{id}", async () => {
    await replaceBook(3, data);

    expect(request).toHaveBeenCalledWith("/books/3", { method: "PUT", body: data });
  });

  it("updateBook sends a PATCH to /books/{id} with only the changes", async () => {
    await updateBook(3, { price: 45 });

    expect(request).toHaveBeenCalledWith("/books/3", { method: "PATCH", body: { price: 45 } });
  });

  it("deleteBook sends a DELETE to /books/{id}", async () => {
    await deleteBook(3);

    expect(request).toHaveBeenCalledWith("/books/3", { method: "DELETE" });
  });
});
