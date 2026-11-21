import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AvailabilityPage from "../../src/pages/AvailabilityPage.jsx";
import { mockApi, ROOM } from "../helpers/mockApi.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillPeriod(user) {
  await user.type(screen.getByLabelText("Data"), "2030-03-11");
  await user.type(screen.getByLabelText("Início"), "10:00");
  await user.type(screen.getByLabelText("Término"), "12:00");
}

describe("AvailabilityPage", () => {
  it("asks for the period before searching", async () => {
    const user = userEvent.setup();
    const calls = mockApi({});
    render(<AvailabilityPage onReserve={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe a data");
    expect(calls).toHaveLength(0);
  });

  it("sends the criteria and offers to reserve the room found", async () => {
    const user = userEvent.setup();
    const onReserve = vi.fn();
    const calls = mockApi({ "GET /rooms/available": [200, [ROOM]] });
    render(<AvailabilityPage onReserve={onReserve} />);

    await fillPeriod(user);
    await user.type(screen.getByLabelText("Participantes"), "20");
    await user.click(screen.getByLabelText("Projetor"));
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await user.click(await screen.findByRole("button", { name: "Reservar" }));

    expect(calls[0].searchParams.get("starts_at")).toBe("2030-03-11T10:00:00");
    expect(calls[0].searchParams.get("attendees")).toBe("20");
    expect(calls[0].searchParams.getAll("resource")).toEqual(["projector"]);
    expect(onReserve).toHaveBeenCalledWith({
      room_id: "1",
      attendees: "20",
      date: "2030-03-11",
      start_time: "10:00",
      end_time: "12:00",
    });
  });

  it("shows when no room is free", async () => {
    const user = userEvent.setup();
    mockApi({ "GET /rooms/available": [200, []] });
    render(<AvailabilityPage onReserve={vi.fn()} />);

    await fillPeriod(user);
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("Nenhuma sala livre com esses critérios.")).toBeInTheDocument();
  });

  it("shows the rule violated by the period", async () => {
    const user = userEvent.setup();
    mockApi({ "GET /rooms/available": [422, { detail: "A reserva deve durar de 30 minutos." }] });
    render(<AvailabilityPage onReserve={vi.fn()} />);

    await fillPeriod(user);
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("30 minutos");
  });
});
