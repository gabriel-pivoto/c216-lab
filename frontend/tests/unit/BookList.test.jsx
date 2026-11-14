import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BookList from "../../src/components/BookList.jsx";

const books = [
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

function renderList(handlers = {}) {
  const props = {
    onEdit: vi.fn(),
    onUpdatePrice: vi.fn().mockResolvedValue(true),
    onRemove: vi.fn(),
    ...handlers,
  };
  render(<BookList books={books} {...props} />);
  return props;
}

describe("BookList", () => {
  it("shows a message when there are no books", () => {
    render(<BookList books={[]} onEdit={vi.fn()} onUpdatePrice={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText("Nenhum livro encontrado.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders one item per book with the formatted data", () => {
    renderList();

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Dom Casmurro")).toBeInTheDocument();
    expect(screen.getByText("Machado de Assis")).toBeInTheDocument();
    expect(screen.getByText("Romance")).toBeInTheDocument();
    expect(screen.getByText("1899 · 256 páginas")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s39,90/)).toBeInTheDocument();
  });

  it("calls onRemove with the id of the clicked book", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderList();

    await user.click(screen.getByRole("button", { name: "Remover 1984" }));

    expect(onRemove).toHaveBeenCalledExactlyOnceWith(2);
  });

  it("calls onEdit with the id of the clicked book", async () => {
    const user = userEvent.setup();
    const { onEdit } = renderList();

    await user.click(screen.getByRole("button", { name: "Editar Dom Casmurro" }));

    expect(onEdit).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("sends the new price and closes the price form", async () => {
    const user = userEvent.setup();
    const { onUpdatePrice } = renderList();

    await user.click(screen.getByRole("button", { name: "Alterar preço de 1984" }));
    const input = screen.getByLabelText("Novo preço (R$)");
    expect(input).toHaveValue(49.9);
    await user.clear(input);
    await user.type(input, "55.5");
    await user.click(screen.getByRole("button", { name: "Salvar preço" }));

    expect(onUpdatePrice).toHaveBeenCalledExactlyOnceWith(2, 55.5);
    expect(screen.queryByLabelText("Novo preço (R$)")).not.toBeInTheDocument();
  });

  it("validates the new price before calling the API", async () => {
    const user = userEvent.setup();
    const { onUpdatePrice } = renderList();

    await user.click(screen.getByRole("button", { name: "Alterar preço de 1984" }));
    await user.clear(screen.getByLabelText("Novo preço (R$)"));
    await user.type(screen.getByLabelText("Novo preço (R$)"), "0");
    await user.click(screen.getByRole("button", { name: "Salvar preço" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Preço deve ser maior que zero.");
    expect(onUpdatePrice).not.toHaveBeenCalled();
  });

  it("keeps the price form open when the API fails", async () => {
    const user = userEvent.setup();
    renderList({ onUpdatePrice: vi.fn().mockResolvedValue(false) });

    await user.click(screen.getByRole("button", { name: "Alterar preço de 1984" }));
    await user.click(screen.getByRole("button", { name: "Salvar preço" }));

    expect(screen.getByLabelText("Novo preço (R$)")).toBeInTheDocument();
  });
});
