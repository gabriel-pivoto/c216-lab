import { expect, test } from "@playwright/test";

const API_URL = (process.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

let author;

test.beforeEach(() => {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  author = `Autor E2E ${test.info().workerIndex} ${suffix}`;
});

test.afterEach(async ({ request }) => {
  const response = await request.get(`${API_URL}/books`, { params: { author, limit: 100 } });
  for (const book of await response.json()) {
    await request.delete(`${API_URL}/books/${book.id}`);
  }
});

function testBook(data = {}) {
  return {
    title: "Vidas Secas",
    author,
    year: 1938,
    pages: 176,
    genre: "Romance",
    price: 29.9,
    ...data,
  };
}

async function fillForm(page, book) {
  await page.getByLabel("Título", { exact: true }).fill(book.title);
  await page.getByLabel("Autor", { exact: true }).fill(book.author);
  await page.getByLabel("Ano", { exact: true }).fill(String(book.year));
  await page.getByLabel("Páginas", { exact: true }).fill(String(book.pages));
  await page.getByLabel("Gênero", { exact: true }).fill(book.genre);
  await page.getByLabel("Preço (R$)", { exact: true }).fill(String(book.price));
}

async function filterByTestAuthor(page) {
  await page.getByLabel("Filtrar por autor").fill(author);
  await page.getByRole("button", { name: "Buscar" }).click();
}

function list(page) {
  return page.getByRole("list", { name: "Livros cadastrados" });
}

test("loads the page and the list of books from the API", async ({ page }) => {
  const listResponse = page.waitForResponse(
    (response) => response.url().startsWith(`${API_URL}/books`) && response.status() === 200,
  );

  await page.goto("/");

  await listResponse;
  await expect(page).toHaveTitle("Gerenciador de Livros");
  await expect(page.getByRole("heading", { name: "Gerenciador de Livros" })).toBeVisible();
  await expect(page.getByTestId("book-counter")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("registers, edits, changes the price and removes a book", async ({ page }) => {
  await page.goto("/");

  await fillForm(page, testBook());
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page.getByRole("status")).toHaveText("Vidas Secas cadastrado.");

  await filterByTestAuthor(page);
  await expect(list(page).getByRole("listitem")).toHaveCount(1);
  await expect(list(page)).toContainText("1938 · 176 páginas");
  await expect(list(page)).toContainText("R$ 29,90");

  await page.getByRole("button", { name: "Editar Vidas Secas" }).click();
  const form = page.getByRole("form", { name: "Editar Vidas Secas" });
  await expect(form.getByLabel("Páginas", { exact: true })).toHaveValue("176");
  await form.getByLabel("Título", { exact: true }).fill("Vidas Secas (edição revista)");
  await form.getByLabel("Páginas", { exact: true }).fill("200");
  await form.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toHaveText("Vidas Secas (edição revista) atualizado.");
  await expect(list(page)).toContainText("1938 · 200 páginas");

  const title = "Vidas Secas (edição revista)";
  await page.getByRole("button", { name: `Alterar preço de ${title}` }).click();
  await page.getByLabel("Novo preço (R$)").fill("45.5");
  await page.getByRole("button", { name: "Salvar preço" }).click();
  await expect(page.getByRole("status")).toHaveText(`Preço de ${title} alterado para R$ 45,50.`);
  await expect(list(page)).toContainText("R$ 45,50");

  await page.getByRole("button", { name: `Remover ${title}` }).click();
  await expect(page.getByRole("status")).toHaveText(`${title} removido.`);
  await expect(page.getByText("Nenhum livro encontrado.")).toBeVisible();
});

test("keeps the book in the database after reloading the page", async ({ page, request }) => {
  await page.goto("/");
  await fillForm(page, testBook({ title: "São Bernardo", pages: 224 }));
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page.getByRole("status")).toHaveText("São Bernardo cadastrado.");

  await page.reload();
  await filterByTestAuthor(page);

  await expect(list(page).getByRole("listitem")).toHaveCount(1);
  await expect(list(page)).toContainText("São Bernardo");

  const response = await request.get(`${API_URL}/books`, { params: { author } });
  expect(await response.json()).toEqual([
    expect.objectContaining({ title: "São Bernardo", author, pages: 224 }),
  ]);
});

test("shows the 404 returned by the API and refreshes the list", async ({ page, request }) => {
  const created = await request.post(`${API_URL}/books`, {
    data: testBook({ title: "Angústia" }),
  });
  const book = await created.json();
  await page.goto("/");
  await filterByTestAuthor(page);
  await expect(list(page).getByRole("listitem")).toHaveCount(1);

  await request.delete(`${API_URL}/books/${book.id}`);
  await page.getByRole("button", { name: "Remover Angústia" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    `Não foi possível remover o livro: Book ${book.id} not found`,
  );
  await expect(page.getByText("Nenhum livro encontrado.")).toBeVisible();
});

test("validates the form without calling the API", async ({ page }) => {
  const posts = [];
  page.on("request", (request) => {
    if (request.method() === "POST") {
      posts.push(request.url());
    }
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Cadastrar" }).click();

  await expect(page.getByRole("form", { name: "Cadastrar livro" }).getByRole("alert")).toHaveCount(
    6,
  );
  await expect(page.getByText("Título é obrigatório.")).toBeVisible();
  expect(posts).toEqual([]);
});

test("warns when the API is down and recovers on retry", async ({ page }) => {
  await page.route(`${API_URL}/**`, (route) => route.abort("connectionrefused"));
  await page.goto("/");

  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível carregar os livros: Não foi possível conectar à API.",
  );
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();

  await page.unroute(`${API_URL}/**`);
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByTestId("book-counter")).toBeVisible();
});
