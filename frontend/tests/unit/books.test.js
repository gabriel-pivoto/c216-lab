import { describe, expect, it } from "vitest";
import { formatPrice, toFormValues } from "../../src/utils/books.js";

describe("formatPrice", () => {
  it("formats the value in reais", () => {
    expect(formatPrice(39.9)).toBe("R$ 39,90");
  });
});

describe("toFormValues", () => {
  it("turns a book from the API into form values", () => {
    const book = {
      id: 1,
      title: "Dom Casmurro",
      author: "Machado de Assis",
      year: 1899,
      pages: 256,
      genre: "Romance",
      price: 39.9,
    };

    expect(toFormValues(book)).toEqual({
      title: "Dom Casmurro",
      author: "Machado de Assis",
      year: "1899",
      pages: "256",
      genre: "Romance",
      price: "39.9",
    });
  });
});
