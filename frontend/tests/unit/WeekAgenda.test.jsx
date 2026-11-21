import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WeekAgenda from "../../src/components/WeekAgenda.jsx";
import { weekDays } from "../../src/utils/datetime.js";
import { RESERVATION } from "../helpers/mockApi.js";

const DAYS = weekDays(new Date(2030, 2, 11));

describe("WeekAgenda", () => {
  it("puts each reservation in the column of its day", () => {
    render(
      <WeekAgenda
        days={DAYS}
        reservations={[
          RESERVATION,
          {
            ...RESERVATION,
            id: 8,
            title: "Reunião",
            starts_at: "2030-03-13T14:00:00",
            ends_at: "2030-03-13T15:00:00",
          },
        ]}
      />,
    );

    const monday = screen.getByRole("list", { name: "Reservas de 11/03/2030" });
    const wednesday = screen.getByRole("list", { name: "Reservas de 13/03/2030" });
    const tuesday = screen.getByRole("list", { name: "Reservas de 12/03/2030" });

    expect(within(monday).getByText("Aula de redes")).toBeInTheDocument();
    expect(within(monday).getByText("10:00 às 12:00")).toBeInTheDocument();
    expect(within(wednesday).getByText("Reunião")).toBeInTheDocument();
    expect(within(tuesday).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("positions the block according to its time", () => {
    render(<WeekAgenda days={DAYS} reservations={[RESERVATION]} />);

    const block = screen.getByRole("listitem");

    expect(block).toHaveStyle({ top: "18.75%", height: "12.5%" });
  });
});
