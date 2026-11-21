import { describe, expect, it } from "vitest";
import {
  hasErrors,
  normalizeReservation,
  normalizeRoom,
  validateReservation,
  validateRoom,
} from "../../src/utils/validation.js";

const VALID_ROOM = {
  name: "Sala 1",
  kind: "classroom",
  location: "Prédio 1",
  capacity: "30",
  resources: ["projector"],
};

const VALID_RESERVATION = {
  room_id: "1",
  title: "Aula",
  requester_name: "Ana",
  requester_email: "ana@example.com",
  attendees: "10",
  date: "2030-03-11",
  start_time: "10:00",
  end_time: "12:00",
  recurring: false,
  weeks: "4",
};

describe("validateRoom", () => {
  it("accepts a valid room", () => {
    expect(hasErrors(validateRoom(VALID_ROOM))).toBe(false);
  });

  it.each([
    ["name", "   "],
    ["name", "x".repeat(101)],
    ["location", ""],
    ["capacity", ""],
    ["capacity", "0"],
    ["capacity", "1001"],
    ["capacity", "1.5"],
  ])("rejects %s = %j", (field, value) => {
    expect(validateRoom({ ...VALID_ROOM, [field]: value })).toHaveProperty(field);
  });

  it("normalizes the values sent to the API", () => {
    expect(normalizeRoom({ ...VALID_ROOM, name: "  Sala 1 " })).toEqual({
      name: "Sala 1",
      kind: "classroom",
      location: "Prédio 1",
      capacity: 30,
      resources: ["projector"],
    });
  });
});

describe("validateReservation", () => {
  it("accepts a valid reservation", () => {
    expect(hasErrors(validateReservation(VALID_RESERVATION))).toBe(false);
  });

  it.each([
    ["room_id", ""],
    ["title", " "],
    ["requester_name", ""],
    ["requester_email", "not-an-email"],
    ["attendees", "0"],
    ["date", ""],
    ["start_time", ""],
    ["end_time", ""],
    ["end_time", "10:00"],
    ["end_time", "09:00"],
  ])("rejects %s = %j", (field, value) => {
    expect(validateReservation({ ...VALID_RESERVATION, [field]: value })).toHaveProperty(field);
  });

  it("checks the weeks only for recurring reservations", () => {
    const invalidWeeks = { ...VALID_RESERVATION, weeks: "1" };

    expect(validateReservation(invalidWeeks)).not.toHaveProperty("weeks");
    expect(validateReservation({ ...invalidWeeks, recurring: true })).toHaveProperty("weeks");
  });

  it("builds the period and omits the weeks of a single reservation", () => {
    expect(normalizeReservation(VALID_RESERVATION)).toEqual({
      room_id: 1,
      title: "Aula",
      requester_name: "Ana",
      requester_email: "ana@example.com",
      attendees: 10,
      starts_at: "2030-03-11T10:00:00",
      ends_at: "2030-03-11T12:00:00",
    });
  });

  it("includes the weeks of a recurring reservation", () => {
    expect(normalizeReservation({ ...VALID_RESERVATION, recurring: true }).weeks).toBe(4);
  });
});
