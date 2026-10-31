import { formatPrice } from "../utils/books.js";

export default function BookList({ books, onRemove }) {
  if (books.length === 0) {
    return (
      <p className="rounded-xl border-2 border-dashed border-stone-300 p-10 text-center text-stone-500">
        Nenhum livro encontrado.
      </p>
    );
  }

  return (
    <ul aria-label="Livros cadastrados" className="grid gap-4 sm:grid-cols-2">
      {books.map((book) => (
        <li
          key={book.id}
          className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
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
          <div className="flex items-center justify-between border-t border-stone-100 pt-3">
            <span className="font-semibold text-emerald-700">{formatPrice(book.price)}</span>
            <button
              type="button"
              onClick={() => onRemove(book.id)}
              aria-label={`Remover ${book.title}`}
              className="rounded-lg px-3 py-1 text-sm font-medium text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              Remover
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
