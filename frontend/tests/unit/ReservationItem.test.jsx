import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ReservationItem from "../../src/components/ReservationItem.jsx";
import { RESERVATION } from "../helpers/mockApi.js";

function buttonNames() {
  return screen.getAllByRole("button").map((button) => button.textContent);
}

function renderItem(overrides = {}, props = {}) {
  const onAction = vi.fn();
  const reservation = { ...RESERVATION, ...overrides };
  render(
    <ul>
      <ReservationItem
        reservation={reservation}
        roomName="Laboratório 3"
        onAction={onAction}
        {...props}
      />
    </ul>,
  );
  return { onAction, reservation };
}

describe("ReservationItem", () => {
  it("shows the reservation data", () => {
    renderItem();

    expect(screen.getByRole("heading", { name: "Aula de redes" })).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByText(/Laboratório 3 · 11\/03\/2030, 10:00 às 12:00/)).toBeInTheDocument();
  });

  it.each([
    ["pending", ["Aprovar", "Rejeitar", "Editar", "Cancelar", "Excluir"]],
    ["approved", ["Cancelar"]],
    ["rejected", ["Excluir"]],
    ["cancelled", ["Excluir"]],
  ])("offers only the actions allowed for %s", (status, expected) => {
    renderItem({ status });

    expect(buttonNames()).toEqual(expected);
  });

  it("restricts the actions when a list is given", () => {
    renderItem({}, { actions: ["approve", "reject"] });

    expect(buttonNames()).toEqual(["Aprovar", "Rejeitar"]);
  });

  it("offers the series cancellation only for active reservations of a series", () => {
    renderItem({ status: "approved", series_id: "abc" });

    expect(screen.getByText("Semanal")).toBeInTheDocument();
    expect(buttonNames()).toEqual(["Cancelar", "Cancelar série"]);
  });

  it("reports the chosen action", async () => {
    const { onAction, reservation } = renderItem();

    await userEvent.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(onAction).toHaveBeenCalledWith("approve", reservation);
  });
});
