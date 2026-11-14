import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BookForm from "../../src/components/BookForm.jsx";

const book = {
  id: 4,
  title: "Vidas Secas",
  author: "Graciliano Ramos",
  year: 1938,
  pages: 176,
  genre: "Romance",
  price: 29.9,
};

async function fillForm(user) {
  await user.type(screen.getByLabelText("Título"), book.title);
  await user.type(screen.getByLabelText("Autor"), book.author);
  await user.type(screen.getByLabelText("Ano"), String(book.year));
  await user.type(screen.getByLabelText("Páginas"), String(book.pages));
  await user.type(screen.getByLabelText("Gênero"), book.genre);
  await user.type(screen.getByLabelText("Preço (R$)"), String(book.price));
}

describe("BookForm", () => {
  it("sends the normalized book and clears the form after a successful create", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<BookForm onSubmit={onSubmit} />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    const { id, ...data } = book;
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(data);
    expect(screen.getByLabelText("Título")).toHaveValue("");
  });

  it("keeps the values when the API rejects the book", async () => {
    const user = userEvent.setup();
    render(<BookForm onSubmit={vi.fn().mockResolvedValue(false)} />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(screen.getByLabelText("Título")).toHaveValue("Vidas Secas");
  });

  it("does not call onSubmit when the form is invalid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BookForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(screen.getAllByRole("alert")).toHaveLength(6);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("fills the fields with the book being edited", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();
    render(<BookForm book={book} onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByRole("form", { name: "Editar Vidas Secas" })).toBeInTheDocument();
    expect(screen.getByLabelText("Autor")).toHaveValue("Graciliano Ramos");
    expect(screen.getByLabelText("Ano")).toHaveValue(1938);

    await user.clear(screen.getByLabelText("Páginas"));
    await user.type(screen.getByLabelText("Páginas"), "200");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ pages: 200 }));

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables the submit button while the request is running", () => {
    render(<BookForm onSubmit={vi.fn()} submitting />);

    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeDisabled();
  });
});
