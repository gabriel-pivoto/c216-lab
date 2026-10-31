import { describe, expect, it } from "vitest";
import { filterByAuthor, formatPrice, nextId } from "../../src/utils/books.js";

const books = [
  {
    id: 1,
    title: "Dom Casmurro",
    author: "Machado de Assis",
    year: 1899,
    pages: 256,
    genre: "Romance",
    price: 39.9,
  },
  {
    id: 4,
    title: "1984",
    author: "George Orwell",
    year: 1949,
    pages: 328,
    genre: "Distopia",
    price: 49.9,
  },
  {
    id: 2,
    title: "Quincas Borba",
    author: "Machado de Assis",
    year: 1891,
    pages: 288,
    genre: "Romance",
    price: 34.9,
  },
];

describe("formatPrice", () => {
  it("formats the value in reais", () => {
    expect(formatPrice(39.9)).toBe("R$ 39,90");
  });
});

describe("filterByAuthor", () => {
  it("returns every book when the term is blank", () => {
    expect(filterByAuthor(books, "  ")).toBe(books);
  });

  it("filters ignoring case", () => {
    const result = filterByAuthor(books, "machado");

    expect(result.map((book) => book.title)).toEqual(["Dom Casmurro", "Quincas Borba"]);
  });

  it("returns an empty list when no author matches", () => {
    expect(filterByAuthor(books, "Clarice")).toEqual([]);
  });
});

describe("nextId", () => {
  it("starts at 1 when there are no books", () => {
    expect(nextId([])).toBe(1);
  });

  it("uses the highest existing id plus 1", () => {
    expect(nextId(books)).toBe(5);
  });
});
