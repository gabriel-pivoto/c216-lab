import { useState } from "react";
import { hasErrors, MAX_YEAR, MIN_YEAR, normalizeBook, validateBook } from "../utils/validation.js";

const INITIAL_VALUES = { title: "", author: "", year: "", pages: "", genre: "", price: "" };

const FIELDS = [
  { name: "title", label: "Título", type: "text", placeholder: "Dom Casmurro" },
  { name: "author", label: "Autor", type: "text", placeholder: "Machado de Assis" },
  {
    name: "year",
    label: "Ano",
    type: "number",
    placeholder: "1899",
    min: MIN_YEAR,
    max: MAX_YEAR,
  },
  { name: "pages", label: "Páginas", type: "number", placeholder: "256", min: 1 },
  { name: "genre", label: "Gênero", type: "text", placeholder: "Romance" },
  { name: "price", label: "Preço (R$)", type: "number", placeholder: "39.90", step: "0.01" },
];

export default function BookForm({ onSubmit }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const newErrors = validateBook(values);
    setErrors(newErrors);
    if (hasErrors(newErrors)) {
      return;
    }
    onSubmit(normalizeBook(values));
    setValues(INITIAL_VALUES);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Cadastrar livro"
      className="space-y-4 rounded-lg bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-800">Cadastrar livro</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ name, label, type, ...extras }) => (
          <div key={name} className="flex flex-col gap-1">
            <label htmlFor={`book-${name}`} className="text-sm font-medium text-slate-700">
              {label}
            </label>
            <input
              id={`book-${name}`}
              name={name}
              type={type}
              value={values[name]}
              onChange={handleChange}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `error-${name}` : undefined}
              className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 aria-invalid:border-red-500"
              {...extras}
            />
            {errors[name] && (
              <p id={`error-${name}`} role="alert" className="text-sm text-red-600">
                {errors[name]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Cadastrar
      </button>
    </form>
  );
}
