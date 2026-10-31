import { formatPrice } from "../utils/books.js";

export default function BookList({ books, onRemove }) {
  if (books.length === 0) {
    return (
      <p className="rounded-lg bg-white p-6 text-slate-500 shadow-sm">Nenhum livro encontrado.</p>
    );
  }

  return (
    <ul aria-label="Livros cadastrados" className="space-y-3">
      {books.map((book) => (
        <li
          key={book.id}
          className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm"
        >
          <div>
            <p className="font-semibold text-slate-800">{book.title}</p>
            <p className="text-sm text-slate-600">{book.author}</p>
            <p className="text-sm text-slate-500">
              {book.year} · {book.pages} páginas · {book.genre} · {formatPrice(book.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(book.id)}
            aria-label={`Remover ${book.title}`}
            className="rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Remover
          </button>
        </li>
      ))}
    </ul>
  );
}
