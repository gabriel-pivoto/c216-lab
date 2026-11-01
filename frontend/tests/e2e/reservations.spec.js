import { expect, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

function futureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function uniqueName(prefix) {
  return `${prefix} ${Date.now()}`;
}

function brazilianDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

async function openPage(page, name) {
  await page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function createRoom(page, name, capacity = "30") {
  await openPage(page, "Salas");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("Tipo", { exact: true }).selectOption("laboratory");
  await page.getByLabel("Capacidade", { exact: true }).fill(capacity);
  await page.getByLabel("Localização", { exact: true }).fill("Prédio 2");
  await page.getByLabel("Projetor", { exact: true }).check();
  await page.getByRole("button", { name: "Salvar sala" }).click();
  await expect(page.getByRole("status")).toHaveText(`Sala ${name} cadastrada.`);
}

async function fillReservation(page, { room, title, date, start, end, attendees = "20" }) {
  await page.getByLabel("Sala", { exact: true }).selectOption({ label: `${room} (30 pessoas)` });
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Solicitante", { exact: true }).fill("Ana Souza");
  await page.getByLabel("E-mail", { exact: true }).fill("ana@example.com");
  await page.getByLabel("Participantes", { exact: true }).fill(attendees);
  await page.getByLabel("Data", { exact: true }).fill(date);
  await page.getByLabel("Início", { exact: true }).fill(start);
  await page.getByLabel("Término", { exact: true }).fill(end);
}

function reservationCard(page, title) {
  return page.getByRole("listitem").filter({ hasText: title });
}

test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/");
});

test("manages a room and persists it through a page reload", async ({ page, request }) => {
  const name = uniqueName("Sala E2E");
  await createRoom(page, name);

  await page.reload();
  await openPage(page, "Salas");
  const card = page.getByRole("listitem").filter({ hasText: name });
  await expect(card).toContainText("Prédio 2");
  await expect(card).toContainText("30 pessoas");

  await card.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Capacidade", { exact: true }).fill("45");
  await page.getByRole("button", { name: "Salvar sala" }).click();
  await expect(card).toContainText("45 pessoas");

  const rooms = await (await request.get(`${API_URL}/rooms`)).json();
  expect(rooms.find((room) => room.name === name).capacity).toBe(45);

  await card.getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByRole("status")).toHaveText(`Sala ${name} excluída.`);
  await expect(card).toHaveCount(0);
});

test("runs the reservation flow against the API and PostgreSQL", async ({ page, request }) => {
  const room = uniqueName("Lab Fluxo");
  const title = uniqueName("Aula");
  const date = futureDate(14);
  await createRoom(page, room);

  await openPage(page, "Reservas");
  await fillReservation(page, { room, title, date, start: "10:00", end: "12:00" });
  await page.getByRole("button", { name: "Salvar reserva" }).click();
  await expect(page.getByRole("status")).toContainText("aguardando aprovação");
  await expect(reservationCard(page, title)).toContainText("Pendente");

  await fillReservation(page, {
    room,
    title: "Conflitante",
    date,
    start: "11:00",
    end: "13:00",
  });
  await page.getByRole("button", { name: "Salvar reserva" }).click();
  await expect(page.getByRole("alert")).toContainText("já está reservada");

  await reservationCard(page, title).getByRole("button", { name: "Aprovar" }).click();
  await expect(page.getByRole("status")).toHaveText("Reserva aprovada.");

  await page.reload();
  await openPage(page, "Reservas");
  await expect(reservationCard(page, title)).toContainText("Aprovada");
  await expect(reservationCard(page, title)).toContainText(brazilianDate(date));

  const reservations = await (await request.get(`${API_URL}/reservations?status=approved`)).json();
  expect(reservations.some((item) => item.title === title)).toBe(true);

  await reservationCard(page, title).getByRole("button", { name: "Cancelar" }).click();
  await expect(reservationCard(page, title)).toContainText("Cancelada");
  await reservationCard(page, title).getByRole("button", { name: "Excluir" }).click();
  await expect(reservationCard(page, title)).toHaveCount(0);
});

test("finds a free room, reserves it and shows it in the agenda", async ({ page }) => {
  const room = uniqueName("Lab Busca");
  const title = uniqueName("Reunião");
  const date = futureDate(21);
  await createRoom(page, room);

  await openPage(page, "Salas livres");
  await page.getByLabel("Data", { exact: true }).fill(date);
  await page.getByLabel("Início", { exact: true }).fill("14:00");
  await page.getByLabel("Término", { exact: true }).fill("15:30");
  await page.getByLabel("Participantes", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page
    .getByRole("listitem")
    .filter({ hasText: room })
    .getByRole("button", { name: "Reservar" })
    .click();

  await expect(page.getByLabel("Início", { exact: true })).toHaveValue("14:00");
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Solicitante", { exact: true }).fill("Ana Souza");
  await page.getByLabel("E-mail", { exact: true }).fill("ana@example.com");
  await page.getByRole("button", { name: "Salvar reserva" }).click();
  await expect(page.getByRole("status")).toContainText("aguardando aprovação");

  await openPage(page, "Salas livres");
  await page.getByLabel("Data", { exact: true }).fill(date);
  await page.getByLabel("Início", { exact: true }).fill("15:00");
  await page.getByLabel("Término", { exact: true }).fill("16:00");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("list", { name: "Salas livres" })).toBeAttached();
  await expect(page.getByRole("heading", { name: room })).toHaveCount(0);

  await openPage(page, "Agenda");
  await page.getByLabel("Sala", { exact: true }).selectOption({ label: room });
  for (let week = 0; week < 3; week += 1) {
    await page.getByRole("button", { name: "Próxima semana" }).click();
    const column = page.getByRole("list", { name: `Reservas de ${brazilianDate(date)}` });
    if ((await column.count()) > 0) {
      await expect(column).toContainText(title);
      await expect(column).toContainText("14:00 às 15:30");
      return;
    }
  }
  throw new Error("A semana da reserva não foi encontrada na agenda");
});

test("creates a weekly series and cancels it", async ({ page }) => {
  const room = uniqueName("Lab Série");
  const title = uniqueName("Monitoria");
  await createRoom(page, room);

  await openPage(page, "Reservas");
  await fillReservation(page, { room, title, date: futureDate(7), start: "08:00", end: "09:00" });
  await page.getByLabel("Repetir semanalmente", { exact: true }).check();
  await page.getByLabel("Número de semanas", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Salvar reserva" }).click();
  await expect(page.getByRole("status")).toHaveText("3 reservas semanais criadas.");

  const cards = reservationCard(page, title);
  await expect(cards).toHaveCount(3);
  await cards.first().getByRole("button", { name: "Cancelar série" }).click();

  await expect(page.getByRole("status")).toHaveText("Série cancelada.");
  await expect(cards.filter({ hasText: "Cancelada" })).toHaveCount(3);
});
