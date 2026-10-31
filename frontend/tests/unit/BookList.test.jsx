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

describe("BookList", () => {
  it("shows a message when there are no books", () => {
    render(<BookList books={[]} onRemove={vi.fn()} />);

    expect(screen.getByText("Nenhum livro encontrado.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders one item per book with the formatted data", () => {
    render(<BookList books={books} onRemove={vi.fn()} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Dom Casmurro")).toBeInTheDocument();
    expect(screen.getByText("Machado de Assis")).toBeInTheDocument();
    expect(screen.getByText(/1899 · 256 páginas · Romance · R\$\s39,90/)).toBeInTheDocument();
  });

  it("calls onRemove with the id of the clicked book", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<BookList books={books} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remover 1984" }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith(2);
  });
});
