import { useState } from "react";

export default function BookFilter({ onSearch }) {
  const [term, setTerm] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(term.trim());
  }

  function handleClear() {
    setTerm("");
    onSearch("");
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Filtrar livros" className="flex flex-col gap-1.5">
      <label
        htmlFor="author-filter"
        className="text-xs font-semibold uppercase tracking-wide text-stone-600"
      >
        Filtrar por autor
      </label>
      <div className="flex gap-2">
        <input
          id="author-filter"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Nome completo, ex.: Machado de Assis"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <button
          type="submit"
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-900"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200"
        >
          Limpar
        </button>
      </div>
    </form>
  );
}
