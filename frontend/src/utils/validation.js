export const MIN_YEAR = 1450;
export const MAX_YEAR = 2100;

const TEXT_LIMITS = {
  title: { label: "Título", max: 200, required: "Título é obrigatório." },
  author: { label: "Autor", max: 100, required: "Autor é obrigatório." },
  genre: { label: "Gênero", max: 50, required: "Gênero é obrigatório." },
};

function validateText(field, value) {
  const { label, max, required } = TEXT_LIMITS[field];
  const text = String(value ?? "").trim();

  if (text.length === 0) {
    return required;
  }
  if (text.length > max) {
    return `${label} deve ter no máximo ${max} caracteres.`;
  }
  return null;
}

function validateYear(value) {
  const text = String(value ?? "").trim();
  if (text === "") {
    return "Ano é obrigatório.";
  }
  const year = Number(text);
  if (!Number.isInteger(year)) {
    return "Ano deve ser um número inteiro.";
  }
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return `Ano deve estar entre ${MIN_YEAR} e ${MAX_YEAR}.`;
  }
  return null;
}

function validatePages(value) {
  const text = String(value ?? "").trim();
  if (text === "") {
    return "Páginas é obrigatório.";
  }
  const pages = Number(text);
  if (!Number.isInteger(pages) || pages <= 0) {
    return "Páginas deve ser um número inteiro maior que zero.";
  }
  return null;
}

function validatePrice(value) {
  const text = String(value ?? "").trim();
  if (text === "") {
    return "Preço é obrigatório.";
  }
  const price = Number(text);
  if (!Number.isFinite(price) || price <= 0) {
    return "Preço deve ser maior que zero.";
  }
  return null;
}

export function validateBook(values) {
  const errors = {
    title: validateText("title", values.title),
    author: validateText("author", values.author),
    year: validateYear(values.year),
    pages: validatePages(values.pages),
    genre: validateText("genre", values.genre),
    price: validatePrice(values.price),
  };

  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message !== null));
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

export function normalizeBook(values) {
  return {
    title: values.title.trim(),
    author: values.author.trim(),
    year: Number(values.year),
    pages: Number(values.pages),
    genre: values.genre.trim(),
    price: Number(values.price),
  };
}
