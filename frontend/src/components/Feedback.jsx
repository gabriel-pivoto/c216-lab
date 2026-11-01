const ALERT_STYLES = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

export function Alert({ type = "error", children }) {
  if (!children) {
    return null;
  }
  return (
    <p
      role={type === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${ALERT_STYLES[type]}`}
    >
      {children}
    </p>
  );
}

export function Notice({ notice }) {
  return notice ? <Alert type={notice.type}>{notice.text}</Alert> : null;
}

export function Loading({ children = "Carregando..." }) {
  return (
    <p role="status" className="text-sm text-slate-500">
      {children}
    </p>
  );
}

export function EmptyState({ children }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
