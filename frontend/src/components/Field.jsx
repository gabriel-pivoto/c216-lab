export default function Field({ id, label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}
