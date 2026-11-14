import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BooksPage from "../../src/pages/BooksPage.jsx";
import { ApiError, NO_CONNECTION_MESSAGE } from "../../src/services/api.js";
import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  replaceBook,
  updateBook,
} from "../../src/services/books.js";

vi.mock("../../src/services/books.js", () => ({
  listBooks: vi.fn(),
  getBook: vi.fn(),
  createBook: vi.fn(),
  replaceBook: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
}));

const domCasmurro = {
  id: 1,
  title: "Dom Casmurro",
  author: "Machado de Assis",
  year: 1899,
  pages: 256,
  genre: "Romance",
  price: 39.9,
};

const orwell = {
  id: 2,
  title: "1984",
  author: "George Orwell",
  year: 1949,
  pages: 328,
  genre: "Distopia",
  price: 49.9,
};

const vidasSecas = {
  title: "Vidas Secas",
  author: "Graciliano Ramos",
  year: 1938,
  pages: 176,
  genre: "Romance",
  price: 29.9,
};

async function fillForm(user, book) {
  await user.type(screen.getByLabelText("Título"), book.title);
  await user.type(screen.getByLabelText("Autor"), book.author);
  await user.type(screen.getByLabelText("Ano"), String(book.year));
  await user.type(screen.getByLabelText("Páginas"), String(book.pages));
  await user.type(screen.getByLabelText("Gênero"), book.genre);
  await user.type(screen.getByLabelText("Preço (R$)"), String(book.price));
}

async function renderPage() {
  render(<BooksPage />);
  return screen.findByRole("list", { name: "Livros cadastrados" });
}

beforeEach(() => {
  vi.resetAllMocks();
  listBooks.mockResolvedValue([domCasmurro, orwell]);
});

describe("BooksPage", () => {
  it("loads the books from the API", async () => {
    render(<BooksPage />);

    expect(screen.getByText("Carregando livros...")).toBeInTheDocument();
    const list = await screen.findByRole("list", { name: "Livros cadastrados" });

    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByTestId("book-counter")).toHaveTextContent("2 livros");
    expect(listBooks).toHaveBeenCalledWith({ author: "" });
  });

  it("shows the error and retries when the list cannot be loaded", async () => {
    const user = userEvent.setup();
    listBooks.mockRejectedValueOnce(new ApiError(NO_CONNECTION_MESSAGE, 0));
    render(<BooksPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      `Não foi possível carregar os livros: ${NO_CONNECTION_MESSAGE}`,
    );

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("list", { name: "Livros cadastrados" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("registers a book through the API and reloads the list", async () => {
    const user = userEvent.setup();
    createBook.mockResolvedValue({ id: 3, ...vidasSecas });
    await renderPage();
    listBooks.mockResolvedValue([domCasmurro, orwell, { id: 3, ...vidasSecas }]);

    await fillForm(user, vidasSecas);
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(createBook).toHaveBeenCalledExactlyOnceWith(vidasSecas);
    expect(await screen.findByRole("status")).toHaveTextContent("Vidas Secas cadastrado.");
    expect(await screen.findByText("Graciliano Ramos")).toBeInTheDocument();
    expect(screen.getByTestId("book-counter")).toHaveTextContent("3 livros");
    expect(screen.getByLabelText("Título")).toHaveValue("");
  });

  it("shows the API error and keeps the form filled when the create fails", async () => {
    const user = userEvent.setup();
    createBook.mockRejectedValue(new ApiError("price: Input should be greater than 0", 422));
    await renderPage();

    await fillForm(user, vidasSecas);
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível cadastrar o livro: price: Input should be greater than 0",
    );
    expect(screen.getByLabelText("Título")).toHaveValue("Vidas Secas");
  });

  it("does not call the API when the form is invalid", async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(screen.getAllByRole("alert")).toHaveLength(6);
    expect(createBook).not.toHaveBeenCalled();
  });

  it("filters by author through the API", async () => {
    const user = userEvent.setup();
    await renderPage();
    listBooks.mockResolvedValue([orwell]);

    await user.type(screen.getByLabelText("Filtrar por autor"), " George Orwell ");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => expect(screen.getByTestId("book-counter")).toHaveTextContent("1 livro"));
    expect(listBooks).toHaveBeenLastCalledWith({ author: "George Orwell" });

    listBooks.mockResolvedValue([domCasmurro, orwell]);
    await user.click(screen.getByRole("button", { name: "Limpar" }));

    await waitFor(() => expect(screen.getByTestId("book-counter")).toHaveTextContent("2 livros"));
    expect(listBooks).toHaveBeenLastCalledWith({ author: "" });
  });

  it("edits a book with GET by id and PUT", async () => {
    const user = userEvent.setup();
    getBook.mockResolvedValue(domCasmurro);
    replaceBook.mockResolvedValue({ ...domCasmurro, pages: 300 });
    await renderPage();

    await user.click(screen.getByRole("button", { name: "Editar Dom Casmurro" }));
    const form = await screen.findByRole("form", { name: "Editar Dom Casmurro" });
    const pages = within(form).getByLabelText("Páginas");
    await user.clear(pages);
    await user.type(pages, "300");
    await user.click(within(form).getByRole("button", { name: "Salvar alterações" }));

    expect(getBook).toHaveBeenCalledWith(1);
    const { id, ...data } = domCasmurro;
    expect(replaceBook).toHaveBeenCalledExactlyOnceWith(id, { ...data, pages: 300 });
    expect(await screen.findByRole("status")).toHaveTextContent("Dom Casmurro atualizado.");
    expect(screen.getByRole("form", { name: "Cadastrar livro" })).toBeInTheDocument();
  });

  it("changes only the price with PATCH", async () => {
    const user = userEvent.setup();
    updateBook.mockResolvedValue({ ...orwell, price: 59.9 });
    await renderPage();

    await user.click(screen.getByRole("button", { name: "Alterar preço de 1984" }));
    await user.clear(screen.getByLabelText("Novo preço (R$)"));
    await user.type(screen.getByLabelText("Novo preço (R$)"), "59.9");
    await user.click(screen.getByRole("button", { name: "Salvar preço" }));

    expect(updateBook).toHaveBeenCalledExactlyOnceWith(2, { price: 59.9 });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Preço de 1984 alterado para R\$\s59,90\./,
    );
  });

  it("removes a book with DELETE and reloads the list", async () => {
    const user = userEvent.setup();
    deleteBook.mockResolvedValue(null);
    await renderPage();
    listBooks.mockResolvedValue([orwell]);

    await user.click(screen.getByRole("button", { name: "Remover Dom Casmurro" }));

    expect(deleteBook).toHaveBeenCalledExactlyOnceWith(1);
    expect(await screen.findByRole("status")).toHaveTextContent("Dom Casmurro removido.");
    await waitFor(() => expect(screen.queryByText("Machado de Assis")).not.toBeInTheDocument());
  });

  it("shows the 404 from the API and reloads the list", async () => {
    const user = userEvent.setup();
    deleteBook.mockRejectedValue(new ApiError("Book 1 not found", 404));
    await renderPage();
    listBooks.mockResolvedValue([orwell]);

    await user.click(screen.getByRole("button", { name: "Remover Dom Casmurro" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível remover o livro: Book 1 not found",
    );
    await waitFor(() => expect(screen.getByTestId("book-counter")).toHaveTextContent("1 livro"));
  });

  it("closes the notice", async () => {
    const user = userEvent.setup();
    deleteBook.mockResolvedValue(null);
    await renderPage();

    await user.click(screen.getByRole("button", { name: "Remover 1984" }));
    await screen.findByRole("status");
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
