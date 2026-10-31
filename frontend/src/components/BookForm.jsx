import { useState } from "react";
import { hasErrors, MAX_YEAR, MIN_YEAR, normalizeBook, validateBook } from "../utils/validation.js";

const INITIAL_VALUES = { title: "", author: "", year: "", pages: "", genre: "", price: "" };

const FIELDS = [
  { name: "title", label: "Título", type: "text", placeholder: "Dom Casmurro", wide: true },
  { name: "author", label: "Autor", type: "text", placeholder: "Machado de Assis", wide: true },
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
      className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 lg:sticky lg:top-6"
    >
      <div className="border-l-4 border-emerald-500 pl-3">
        <h2 className="text-lg font-semibold text-stone-900">Cadastrar livro</h2>
        <p className="text-sm text-stone-500">Todos os campos são obrigatórios.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map(({ name, label, type, wide, ...extras }) => (
          <div key={name} className={`flex flex-col gap-1.5 ${wide ? "col-span-2" : ""}`}>
            <label
              htmlFor={`book-${name}`}
              className="text-xs font-semibold uppercase tracking-wide text-stone-600"
            >
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
              className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 aria-invalid:border-rose-500 aria-invalid:bg-rose-50"
              {...extras}
            />
            {errors[name] && (
              <p id={`error-${name}`} role="alert" className="text-xs font-medium text-rose-600">
                {errors[name]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        Cadastrar
      </button>
    </form>
  );
}
