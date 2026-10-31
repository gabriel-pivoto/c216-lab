export default function BookFilter({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="author-filter"
        className="text-xs font-semibold uppercase tracking-wide text-stone-600"
      >
        Filtrar por autor
      </label>
      <input
        id="author-filter"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ex.: Machado de Assis"
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
    </div>
  );
}
