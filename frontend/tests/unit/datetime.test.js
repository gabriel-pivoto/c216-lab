import { describe, expect, it } from "vitest";
import {
  addDays,
  agendaPosition,
  combineDateTime,
  formatDate,
  formatPeriod,
  formatTime,
  splitDateTime,
  startOfWeek,
  toDateInput,
  weekDays,
} from "../../src/utils/datetime.js";

describe("date formatting", () => {
  it("keeps the wall-clock time sent by the API", () => {
    expect(formatDate("2030-03-11T22:30:00")).toBe("11/03/2030");
    expect(formatTime("2030-03-11T22:30:00")).toBe("22:30");
    expect(formatPeriod("2030-03-11T10:00:00", "2030-03-11T12:30:00")).toBe(
      "11/03/2030, 10:00 às 12:30",
    );
  });

  it("combines and splits date and time", () => {
    expect(combineDateTime("2030-03-11", "10:00")).toBe("2030-03-11T10:00:00");
    expect(splitDateTime("2030-03-11T10:00:00")).toEqual({ date: "2030-03-11", time: "10:00" });
  });

  it("formats a date for inputs using the local calendar", () => {
    expect(toDateInput(new Date(2030, 0, 5, 23, 59))).toBe("2030-01-05");
  });
});

describe("week helpers", () => {
  it("starts the week on monday", () => {
    expect(toDateInput(startOfWeek(new Date(2030, 2, 11)))).toBe("2030-03-11");
    expect(toDateInput(startOfWeek(new Date(2030, 2, 13)))).toBe("2030-03-11");
    expect(toDateInput(startOfWeek(new Date(2030, 2, 17)))).toBe("2030-03-11");
  });

  it("crosses month boundaries", () => {
    expect(toDateInput(addDays(new Date(2030, 0, 31), 1))).toBe("2030-02-01");
  });

  it("lists the seven days of the week", () => {
    const days = weekDays(new Date(2030, 2, 11));

    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ label: "Seg", date: "2030-03-11" });
    expect(days[6]).toEqual({ label: "Dom", date: "2030-03-17" });
  });
});

describe("agendaPosition", () => {
  it("places the whole opening period over the whole column", () => {
    expect(agendaPosition("2030-03-11T07:00:00", "2030-03-11T23:00:00")).toEqual({
      top: "0%",
      height: "100%",
    });
  });

  it("places a block proportionally to its time", () => {
    expect(agendaPosition("2030-03-11T11:00:00", "2030-03-11T15:00:00")).toEqual({
      top: "25%",
      height: "25%",
    });
  });
});
