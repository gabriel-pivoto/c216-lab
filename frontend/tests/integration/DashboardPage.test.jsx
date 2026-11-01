import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "../../src/pages/DashboardPage.jsx";
import { mockApi, RESERVATION, ROOM } from "../helpers/mockApi.js";

const SUMMARY = {
  total_rooms: 4,
  pending_reservations: 2,
  reservations_today: 3,
  approved_next_7_days: 5,
  occupancy_today_percent: 12.5,
  busiest_rooms: [{ room_id: 1, room_name: "Laboratório 3", reservations: 6, hours: 9 }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DashboardPage", () => {
  it("shows the summary, the pending reservations and the busiest rooms", async () => {
    const calls = mockApi({
      "GET /dashboard/summary": [200, SUMMARY],
      "GET /reservations": [200, [RESERVATION]],
      "GET /rooms": [200, [ROOM]],
    });

    render(<DashboardPage />);

    expect(screen.getByText("Carregando painel...")).toBeInTheDocument();
    expect(await screen.findByText("12.5%")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aula de redes" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Laboratório 3" })).toBeInTheDocument();
    expect(calls.find((call) => call.pathname === "/reservations").searchParams.get("status")).toBe(
      "pending",
    );
  });

  it("approves from the panel and reloads it", async () => {
    const user = userEvent.setup();
    let pending = [RESERVATION];
    mockApi({
      "GET /dashboard/summary": [200, SUMMARY],
      "GET /reservations": () => [200, pending],
      "GET /rooms": [200, [ROOM]],
      "POST /reservations/7/approve": () => {
        pending = [];
        return [200, { ...RESERVATION, status: "approved" }];
      },
    });
    render(<DashboardPage />);

    await user.click(await screen.findByRole("button", { name: "Aprovar" }));

    expect(await screen.findByText("Reserva aprovada.")).toBeInTheDocument();
    expect(await screen.findByText("Nenhuma reserva pendente.")).toBeInTheDocument();
  });

  it("shows an error when the panel cannot be loaded", async () => {
    mockApi({ "GET /dashboard/summary": [500, { detail: "Erro interno" }] });

    render(<DashboardPage />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
