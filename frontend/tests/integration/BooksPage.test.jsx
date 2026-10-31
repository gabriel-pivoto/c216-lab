import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import BooksPage from "../../src/pages/BooksPage.jsx";

const initialBooks = [
  {
    id: 1,
    title: "Dom Casmurro",
    author: "Machado de Assis",
    year: 1899,
    pages: 256,
    genre: "Romance",
    price: 39.9,
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    year: 1949,
    pages: 328,
    genre: "Distopia",
    price: 49.9,
  },
];

async function fillForm(user, { title, author, year, pages, genre, price }) {
  await user.type(screen.getByLabelText("Título"), title);
  await user.type(screen.getByLabelText("Autor"), author);
  await user.type(screen.getByLabelText("Ano"), year);
  await user.type(screen.getByLabelText("Páginas"), pages);
  await user.type(screen.getByLabelText("Gênero"), genre);
  await user.type(screen.getByLabelText("Preço (R$)"), price);
}

function listItems() {
  return within(screen.getByRole("list", { name: "Livros cadastrados" })).getAllByRole("listitem");
}

describe("BooksPage", () => {
  it("registers a valid book, adds it to the list and clears the form", async () => {
    const user = userEvent.setup();
    render(<BooksPage initialBooks={initialBooks} />);

    await fillForm(user, {
      title: "Vidas Secas",
      author: "Graciliano Ramos",
      year: "1938",
      pages: "176",
      genre: "Romance",
      price: "29.90",
    });
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(listItems()).toHaveLength(3);
    expect(screen.getByText("Vidas Secas")).toBeInTheDocument();
    expect(screen.getByTestId("book-counter")).toHaveTextContent("3 de 3");
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the validation errors and does not register an invalid book", async () => {
    const user = userEvent.setup();
    render(<BooksPage initialBooks={initialBooks} />);

    await fillForm(user, {
      title: "Vidas Secas",
      author: "Graciliano Ramos",
      year: "1000",
      pages: "176",
      genre: "Romance",
      price: "0",
    });
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    const alerts = screen.getAllByRole("alert").map((alert) => alert.textContent);
    expect(alerts).toEqual(["Ano deve estar entre 1450 e 2100.", "Preço deve ser maior que zero."]);
    expect(screen.getByLabelText("Ano")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Vidas Secas")).not.toBeInTheDocument();
    expect(listItems()).toHaveLength(2);
  });

  it("filters the list by author", async () => {
    const user = userEvent.setup();
    render(<BooksPage initialBooks={initialBooks} />);

    await user.type(screen.getByLabelText("Filtrar por autor"), "orwell");

    expect(listItems()).toHaveLength(1);
    expect(screen.getByText("1984")).toBeInTheDocument();
    expect(screen.getByTestId("book-counter")).toHaveTextContent("1 de 2");

    await user.clear(screen.getByLabelText("Filtrar por autor"));
    await user.type(screen.getByLabelText("Filtrar por autor"), "clarice");

    expect(screen.getByText("Nenhum livro encontrado.")).toBeInTheDocument();
  });

  it("removes a book from the list", async () => {
    const user = userEvent.setup();
    render(<BooksPage initialBooks={initialBooks} />);

    await user.click(screen.getByRole("button", { name: "Remover Dom Casmurro" }));

    expect(listItems()).toHaveLength(1);
    expect(screen.queryByText("Dom Casmurro")).not.toBeInTheDocument();
    expect(screen.getByTestId("book-counter")).toHaveTextContent("1 de 1");
  });
});
