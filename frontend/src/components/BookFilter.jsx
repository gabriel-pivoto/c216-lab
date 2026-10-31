export default function BookFilter({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="author-filter" className="text-sm font-medium text-slate-700">
        Filtrar por autor
      </label>
      <input
        id="author-filter"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ex.: Machado de Assis"
        className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );
}
