import { describe, expect, it } from "vitest";
import {
  hasErrors,
  MAX_YEAR,
  MIN_YEAR,
  normalizeBook,
  validateBook,
} from "../../src/utils/validation.js";

const validBook = {
  title: "Dom Casmurro",
  author: "Machado de Assis",
  year: "1899",
  pages: "256",
  genre: "Romance",
  price: "39.90",
};

describe("validateBook", () => {
  it("returns no errors for a valid book", () => {
    expect(validateBook(validBook)).toEqual({});
  });

  it("requires every field", () => {
    const errors = validateBook({
      title: "",
      author: "",
      year: "",
      pages: "",
      genre: "",
      price: "",
    });

    expect(errors).toEqual({
      title: "Título é obrigatório.",
      author: "Autor é obrigatório.",
      year: "Ano é obrigatório.",
      pages: "Páginas é obrigatório.",
      genre: "Gênero é obrigatório.",
      price: "Preço é obrigatório.",
    });
  });

  it("treats whitespace-only text as empty", () => {
    expect(validateBook({ ...validBook, author: "   " }).author).toBe("Autor é obrigatório.");
  });

  it("limits the length of the text fields", () => {
    const errors = validateBook({
      ...validBook,
      title: "a".repeat(201),
      author: "a".repeat(101),
      genre: "a".repeat(51),
    });

    expect(errors.title).toBe("Título deve ter no máximo 200 caracteres.");
    expect(errors.author).toBe("Autor deve ter no máximo 100 caracteres.");
    expect(errors.genre).toBe("Gênero deve ter no máximo 50 caracteres.");
  });

  it("accepts the boundary years", () => {
    expect(validateBook({ ...validBook, year: String(MIN_YEAR) })).toEqual({});
    expect(validateBook({ ...validBook, year: String(MAX_YEAR) })).toEqual({});
  });

  it.each([String(MIN_YEAR - 1), String(MAX_YEAR + 1)])(
    "rejects the out-of-range year %s",
    (year) => {
      expect(validateBook({ ...validBook, year }).year).toBe(
        `Ano deve estar entre ${MIN_YEAR} e ${MAX_YEAR}.`,
      );
    },
  );

  it("rejects a non-integer year", () => {
    expect(validateBook({ ...validBook, year: "1899.5" }).year).toBe(
      "Ano deve ser um número inteiro.",
    );
  });

  it.each(["0", "-5", "12.5", "abc"])("rejects %s pages", (pages) => {
    expect(validateBook({ ...validBook, pages }).pages).toBe(
      "Páginas deve ser um número inteiro maior que zero.",
    );
  });

  it.each(["0", "-10", "abc"])("rejects the price %s", (price) => {
    expect(validateBook({ ...validBook, price }).price).toBe("Preço deve ser maior que zero.");
  });
});

describe("hasErrors", () => {
  it("tells whether the errors object has any field", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ title: "Título é obrigatório." })).toBe(true);
  });
});

describe("normalizeBook", () => {
  it("trims text and converts the numeric fields", () => {
    const book = normalizeBook({ ...validBook, title: "  Dom Casmurro " });

    expect(book).toEqual({
      title: "Dom Casmurro",
      author: "Machado de Assis",
      year: 1899,
      pages: 256,
      genre: "Romance",
      price: 39.9,
    });
  });
});
