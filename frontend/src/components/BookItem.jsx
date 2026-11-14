import { useState } from "react";
import { formatPrice } from "../utils/books.js";
import { validatePrice } from "../utils/validation.js";

export default function BookItem({ book, onEdit, onUpdatePrice, onRemove }) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [price, setPrice] = useState(String(book.price));
  const [error, setError] = useState(null);

  function openPriceEditor() {
    setPrice(String(book.price));
    setError(null);
    setEditingPrice(true);
  }

  async function handleSavePrice(event) {
    event.preventDefault();
    const message = validatePrice(price);
    setError(message);
    if (message) {
      return;
    }
    const saved = await onUpdatePrice(book.id, Number(price));
    if (saved) {
      setEditingPrice(false);
    }
  }

  return (
    <li className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="space-y-2">
        <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          {book.genre}
        </span>
        <p className="text-lg font-semibold leading-snug text-stone-900">{book.title}</p>
        <p className="text-sm text-stone-600">{book.author}</p>
        <p className="text-xs text-stone-400">
          {book.year} · {book.pages} páginas
        </p>
      </div>

      {editingPrice && (
        <form
          onSubmit={handleSavePrice}
          noValidate
          aria-label={`Novo preço de ${book.title}`}
          className="space-y-2 rounded-lg bg-stone-50 p-3"
        >
          <label
            htmlFor={`price-${book.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-stone-600"
          >
            Novo preço (R$)
          </label>
          <div className="flex gap-2">
            <input
              id={`price-${book.id}`}
              type="number"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              aria-invalid={Boolean(error)}
              className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 aria-invalid:border-rose-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Salvar preço
            </button>
            <button
              type="button"
              onClick={() => setEditingPrice(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-200"
            >
              Cancelar
            </button>
          </div>
          {error && (
            <p role="alert" className="text-xs font-medium text-rose-600">
              {error}
            </p>
          )}
        </form>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <span className="font-semibold text-emerald-700">{formatPrice(book.price)}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(book.id)}
            aria-label={`Editar ${book.title}`}
            className="rounded-lg px-2.5 py-1 text-sm font-medium text-stone-500 transition-colors hover:bg-amber-50 hover:text-amber-700"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={openPriceEditor}
            aria-label={`Alterar preço de ${book.title}`}
            className="rounded-lg px-2.5 py-1 text-sm font-medium text-stone-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
          >
            Preço
          </button>
          <button
            type="button"
            onClick={() => onRemove(book.id)}
            aria-label={`Remover ${book.title}`}
            className="rounded-lg px-2.5 py-1 text-sm font-medium text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            Remover
          </button>
        </div>
      </div>
    </li>
  );
}
