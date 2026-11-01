import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import RoomsPage from "../../src/pages/RoomsPage.jsx";
import { mockApi, ROOM } from "../helpers/mockApi.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillRoomForm(user) {
  await user.type(screen.getByLabelText("Nome"), "Auditório");
  await user.selectOptions(screen.getByLabelText("Tipo"), "auditorium");
  await user.type(screen.getByLabelText("Capacidade"), "100");
  await user.type(screen.getByLabelText("Localização"), "Prédio 1");
  await user.click(screen.getByLabelText("Projetor"));
}

describe("RoomsPage", () => {
  it("shows the loading state and then the rooms", async () => {
    mockApi({ "GET /rooms": [200, [ROOM]] });

    render(<RoomsPage />);

    expect(screen.getByText("Carregando salas...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Laboratório 3" })).toBeInTheDocument();
    expect(screen.queryByText("Carregando salas...")).not.toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    mockApi({ "GET /rooms": [200, []] });

    render(<RoomsPage />);

    expect(await screen.findByText("Nenhuma sala encontrada.")).toBeInTheDocument();
  });

  it("shows an error when the list fails", async () => {
    mockApi({ "GET /rooms": [500, { detail: "Erro interno" }] });

    render(<RoomsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno");
  });

  it("creates a room and reloads the list", async () => {
    const user = userEvent.setup();
    const rooms = [];
    const calls = mockApi({
      "GET /rooms": () => [200, rooms],
      "POST /rooms": ({ body }) => {
        rooms.push({ id: 2, ...body });
        return [201, rooms[0]];
      },
    });
    render(<RoomsPage />);
    await screen.findByText("Nenhuma sala encontrada.");

    await fillRoomForm(user);
    await user.click(screen.getByRole("button", { name: "Salvar sala" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Sala Auditório cadastrada.");
    expect(await screen.findByRole("heading", { name: "Auditório" })).toBeInTheDocument();
    expect(calls.find((call) => call.method === "POST").body).toEqual({
      name: "Auditório",
      kind: "auditorium",
      location: "Prédio 1",
      capacity: 100,
      resources: ["projector"],
    });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("does not call the API when the form is invalid", async () => {
    const user = userEvent.setup();
    const calls = mockApi({ "GET /rooms": [200, []] });
    render(<RoomsPage />);
    await screen.findByText("Nenhuma sala encontrada.");

    await user.click(screen.getByRole("button", { name: "Salvar sala" }));

    expect(screen.getByText("Informe o nome da sala.")).toBeInTheDocument();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });

  it("keeps the typed data and shows the API error", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /rooms": [200, []],
      "POST /rooms": [409, { detail: "Já existe uma sala chamada 'Auditório'." }],
    });
    render(<RoomsPage />);
    await screen.findByText("Nenhuma sala encontrada.");

    await fillRoomForm(user);
    await user.click(screen.getByRole("button", { name: "Salvar sala" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe uma sala");
    expect(screen.getByLabelText("Nome")).toHaveValue("Auditório");
  });

  it("edits a room with its current values", async () => {
    const user = userEvent.setup();
    const calls = mockApi({
      "GET /rooms": [200, [ROOM]],
      "PUT /rooms/1": ({ body }) => [200, { id: 1, ...body }],
    });
    render(<RoomsPage />);
    const list = await screen.findByRole("list", { name: "Salas cadastradas" });
    await within(list).findByText("Laboratório 3");

    await user.click(within(list).getByRole("button", { name: "Editar" }));
    const capacity = screen.getByLabelText("Capacidade");
    expect(capacity).toHaveValue(30);
    await user.clear(capacity);
    await user.type(capacity, "25");
    await user.click(screen.getByRole("button", { name: "Salvar sala" }));

    expect(await screen.findByText("Sala Laboratório 3 atualizada.")).toBeInTheDocument();
    expect(calls.find((call) => call.method === "PUT").body.capacity).toBe(25);
  });

  it("deletes only after the confirmation", async () => {
    const user = userEvent.setup();
    const calls = mockApi({ "GET /rooms": [200, [ROOM]], "DELETE /rooms/1": [204] });
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(<RoomsPage />);
    await screen.findByText("Laboratório 3");

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(calls.some((call) => call.method === "DELETE")).toBe(false);

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(calls.some((call) => call.method === "DELETE")).toBe(true));
    expect(await screen.findByText("Sala Laboratório 3 excluída.")).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("shows why a room cannot be deleted", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /rooms": [200, [ROOM]],
      "DELETE /rooms/1": [409, { detail: "A sala tem reservas futuras ativas." }],
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<RoomsPage />);
    await screen.findByText("Laboratório 3");

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("reservas futuras ativas");
    confirm.mockRestore();
  });

  it("filters by kind through the API", async () => {
    const user = userEvent.setup();
    const calls = mockApi({ "GET /rooms": [200, []] });
    render(<RoomsPage />);
    await screen.findByText("Nenhuma sala encontrada.");

    await user.selectOptions(screen.getByLabelText("Filtrar por tipo"), "laboratory");

    await waitFor(() => expect(calls.at(-1).searchParams.get("kind")).toBe("laboratory"));
  });
});
