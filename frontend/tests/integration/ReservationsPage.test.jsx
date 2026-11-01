import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReservationsPage from "../../src/pages/ReservationsPage.jsx";
import { mockApi, RESERVATION, ROOM } from "../helpers/mockApi.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillForm(user) {
  await user.selectOptions(screen.getByLabelText("Sala"), "1");
  await user.type(screen.getByLabelText("Título"), "Aula de redes");
  await user.type(screen.getByLabelText("Solicitante"), "Ana Souza");
  await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
  await user.type(screen.getByLabelText("Participantes"), "20");
  await user.type(screen.getByLabelText("Data"), "2030-03-11");
  await user.type(screen.getByLabelText("Início"), "10:00");
  await user.type(screen.getByLabelText("Término"), "12:00");
}

async function renderPage(routes, props = {}) {
  const calls = mockApi({ "GET /rooms": [200, [ROOM]], ...routes });
  render(<ReservationsPage {...props} />);
  await screen.findByRole("option", { name: "Laboratório 3 (30 pessoas)" });
  return calls;
}

describe("ReservationsPage", () => {
  it("lists the reservations with the room name", async () => {
    await renderPage({ "GET /reservations": [200, [RESERVATION]] });

    expect(await screen.findByRole("heading", { name: "Aula de redes" })).toBeInTheDocument();
    expect(screen.getByText(/Laboratório 3 · 11\/03\/2030/)).toBeInTheDocument();
  });

  it("creates a single reservation", async () => {
    const user = userEvent.setup();
    const calls = await renderPage({
      "GET /reservations": [200, []],
      "POST /reservations": ({ body }) => [201, { ...RESERVATION, ...body }],
    });

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Salvar reserva" }));

    expect(await screen.findByRole("status")).toHaveTextContent("aguardando aprovação");
    expect(calls.find((call) => call.method === "POST").body).toEqual({
      room_id: 1,
      title: "Aula de redes",
      requester_name: "Ana Souza",
      requester_email: "ana@example.com",
      attendees: 20,
      starts_at: "2030-03-11T10:00:00",
      ends_at: "2030-03-11T12:00:00",
    });
  });

  it("creates a weekly series", async () => {
    const user = userEvent.setup();
    const calls = await renderPage({
      "GET /reservations": [200, []],
      "POST /reservations/recurring": [201, [RESERVATION, RESERVATION, RESERVATION]],
    });

    await fillForm(user);
    await user.click(screen.getByLabelText("Repetir semanalmente"));
    const weeks = screen.getByLabelText("Número de semanas");
    await user.clear(weeks);
    await user.type(weeks, "3");
    await user.click(screen.getByRole("button", { name: "Salvar reserva" }));

    expect(await screen.findByText("3 reservas semanais criadas.")).toBeInTheDocument();
    expect(calls.find((call) => call.method === "POST").body.weeks).toBe(3);
  });

  it("shows the conflict returned by the API and keeps the form filled", async () => {
    const user = userEvent.setup();
    await renderPage({
      "GET /reservations": [200, []],
      "POST /reservations": [409, { detail: "A sala já está reservada em: 11/03/2030." }],
    });

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Salvar reserva" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("já está reservada");
    expect(screen.getByLabelText("Título")).toHaveValue("Aula de redes");
  });

  it("approves a reservation and reloads the list", async () => {
    const user = userEvent.setup();
    let current = RESERVATION;
    await renderPage({
      "GET /reservations": () => [200, [current]],
      "POST /reservations/7/approve": () => {
        current = { ...RESERVATION, status: "approved" };
        return [200, current];
      },
    });

    await user.click(await screen.findByRole("button", { name: "Aprovar" }));

    expect(await screen.findByText("Reserva aprovada.")).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Reservas cadastradas" });
    expect(await within(list).findByText("Aprovada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument();
  });

  it("edits a pending reservation with its current values", async () => {
    const user = userEvent.setup();
    const calls = await renderPage({
      "GET /reservations": [200, [RESERVATION]],
      "PUT /reservations/7": ({ body }) => [200, { ...RESERVATION, ...body }],
    });

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    const title = screen.getByLabelText("Título");
    expect(title).toHaveValue("Aula de redes");
    expect(screen.getByLabelText("Início")).toHaveValue("10:00");
    expect(screen.queryByLabelText("Repetir semanalmente")).not.toBeInTheDocument();
    await user.clear(title);
    await user.type(title, "Prova");
    await user.click(screen.getByRole("button", { name: "Salvar reserva" }));

    expect(await screen.findByText("Reserva atualizada.")).toBeInTheDocument();
    expect(calls.find((call) => call.method === "PUT").body.title).toBe("Prova");
  });

  it("shows an error when an action fails", async () => {
    const user = userEvent.setup();
    await renderPage({
      "GET /reservations": [200, [RESERVATION]],
      "POST /reservations/7/approve": [422, { detail: "Uma reserva que já começou." }],
    });

    await user.click(await screen.findByRole("button", { name: "Aprovar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("já começou");
  });

  it("fills the form with the values chosen in the search", async () => {
    await renderPage(
      { "GET /reservations": [200, []] },
      { prefill: { room_id: "1", date: "2030-03-11", start_time: "10:00", end_time: "12:00" } },
    );

    await waitFor(() => expect(screen.getByLabelText("Sala")).toHaveValue("1"));
    expect(screen.getByLabelText("Data")).toHaveValue("2030-03-11");
  });

  it("filters by status through the API", async () => {
    const user = userEvent.setup();
    const calls = await renderPage({ "GET /reservations": [200, []] });

    await user.selectOptions(screen.getByLabelText("Status"), "approved");

    await waitFor(() => expect(calls.at(-1).searchParams.get("status")).toBe("approved"));
  });
});
