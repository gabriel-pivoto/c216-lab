import { useState } from "react";
import AgendaPage from "./pages/AgendaPage.jsx";
import AvailabilityPage from "./pages/AvailabilityPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ReservationsPage from "./pages/ReservationsPage.jsx";
import RoomsPage from "./pages/RoomsPage.jsx";

const PAGES = [
  { id: "dashboard", label: "Painel" },
  { id: "reservations", label: "Reservas" },
  { id: "availability", label: "Salas livres" },
  { id: "agenda", label: "Agenda" },
  { id: "rooms", label: "Salas" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [prefill, setPrefill] = useState(null);

  function navigate(target) {
    setPrefill(null);
    setPage(target);
  }

  function reserve(values) {
    setPrefill(values);
    setPage("reservations");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
          <h1 className="text-xl font-bold text-indigo-700">SalaCerta</h1>
          <nav aria-label="Principal" className="flex flex-wrap gap-1">
            {PAGES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-current={page === id ? "page" : undefined}
                className={`btn ${
                  page === id
                    ? "bg-indigo-100 text-indigo-900"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => navigate(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {page === "dashboard" ? <DashboardPage /> : null}
        {page === "reservations" ? <ReservationsPage prefill={prefill} /> : null}
        {page === "availability" ? <AvailabilityPage onReserve={reserve} /> : null}
        {page === "agenda" ? <AgendaPage /> : null}
        {page === "rooms" ? <RoomsPage /> : null}
      </main>
    </div>
  );
}
