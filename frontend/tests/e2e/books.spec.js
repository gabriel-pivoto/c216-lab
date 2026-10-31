import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows the page with the sample books", async ({ page }) => {
  await expect(page).toHaveTitle("Gerenciador de Livros");
  await expect(page.getByRole("heading", { name: "Gerenciador de Livros" })).toBeVisible();

  const list = page.getByRole("list", { name: "Livros cadastrados" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(list).toContainText("Dom Casmurro");
  await expect(list).toContainText("1984");
});

test("registers, filters and removes a book", async ({ page }) => {
  await page.getByLabel("Título", { exact: true }).fill("Vidas Secas");
  await page.getByLabel("Autor", { exact: true }).fill("Graciliano Ramos");
  await page.getByLabel("Ano", { exact: true }).fill("1938");
  await page.getByLabel("Páginas", { exact: true }).fill("176");
  await page.getByLabel("Gênero", { exact: true }).fill("Romance");
  await page.getByLabel("Preço (R$)", { exact: true }).fill("29.90");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  const list = page.getByRole("list", { name: "Livros cadastrados" });
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await expect(list).toContainText("Vidas Secas");
  await expect(list).toContainText("R$ 29,90");

  await page.getByLabel("Filtrar por autor").fill("gracil");
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByTestId("book-counter")).toHaveText("1 de 3");

  await page.getByRole("button", { name: "Remover Vidas Secas" }).click();
  await expect(page.getByText("Nenhum livro encontrado.")).toBeVisible();
  await expect(page.getByTestId("book-counter")).toHaveText("0 de 2");
});

test("shows errors when the empty form is submitted", async ({ page }) => {
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await expect(page.getByRole("alert")).toHaveCount(6);
  await expect(page.getByText("Título é obrigatório.")).toBeVisible();
  await expect(page.getByText("Preço é obrigatório.")).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Livros cadastrados" }).getByRole("listitem"),
  ).toHaveCount(2);
});
