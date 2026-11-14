import { useEffect, useState } from "react";
import BookFilter from "../components/BookFilter.jsx";
import BookForm from "../components/BookForm.jsx";
import BookList from "../components/BookList.jsx";
import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  replaceBook,
  updateBook,
} from "../services/books.js";
import { formatPrice } from "../utils/books.js";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [query, setQuery] = useState({ author: "" });
  const [editingBook, setEditingBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setListError(null);

    listBooks({ author: query.author })
      .then((data) => {
        if (active) {
          setBooks(data);
        }
      })
      .catch((error) => {
        if (active) {
          setBooks([]);
          setListError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [query]);

  function reload() {
    setQuery((current) => ({ ...current }));
  }

  function search(author) {
    setQuery({ author });
  }

  async function run(action, successMessage, failureMessage) {
    setNotice(null);
    try {
      const result = await action();
      setNotice({ type: "success", text: successMessage(result) });
      reload();
      return true;
    } catch (error) {
      setNotice({ type: "error", text: `${failureMessage}: ${error.message}` });
      if (error.status === 404) {
        reload();
      }
      return false;
    }
  }

  async function saveBook(data) {
    setSubmitting(true);
    const saved = editingBook
      ? await run(
          () => replaceBook(editingBook.id, data),
          (book) => `${book.title} atualizado.`,
          "Não foi possível salvar o livro",
        )
      : await run(
          () => createBook(data),
          (book) => `${book.title} cadastrado.`,
          "Não foi possível cadastrar o livro",
        );
    setSubmitting(false);
    if (saved) {
      setEditingBook(null);
    }
    return saved;
  }

  async function startEditing(id) {
    setNotice(null);
    try {
      setEditingBook(await getBook(id));
    } catch (error) {
      setNotice({ type: "error", text: `Não foi possível carregar o livro: ${error.message}` });
      if (error.status === 404) {
        reload();
      }
    }
  }

  function changePrice(id, price) {
    return run(
      () => updateBook(id, { price }),
      (book) => `Preço de ${book.title} alterado para ${formatPrice(book.price)}.`,
      "Não foi possível alterar o preço",
    );
  }

  async function removeBook(id) {
    const book = books.find((item) => item.id === id);
    const removed = await run(
      () => deleteBook(id),
      () => `${book ? book.title : "Livro"} removido.`,
      "Não foi possível remover o livro",
    );
    if (removed && editingBook?.id === id) {
      setEditingBook(null);
    }
    return removed;
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
            notice.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <p role={notice.type === "error" ? "alert" : "status"}>{notice.text}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Fechar aviso"
            className="font-bold leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <BookForm
            key={editingBook?.id ?? "new"}
            book={editingBook}
            onSubmit={saveBook}
            onCancel={() => setEditingBook(null)}
            submitting={submitting}
          />
        </div>

        <section
          aria-labelledby="list-title"
          aria-busy={loading}
          className="space-y-5 lg:col-span-3"
        >
          <div className="flex items-center justify-between">
            <h2 id="list-title" className="text-xl font-semibold text-stone-900">
              Livros
            </h2>
            {!loading && !listError && (
              <span
                className="rounded-full bg-stone-200 px-3 py-1 text-sm font-medium text-stone-700"
                data-testid="book-counter"
              >
                {books.length} {books.length === 1 ? "livro" : "livros"}
              </span>
            )}
          </div>

          <BookFilter onSearch={search} />

          {loading ? (
            <p className="rounded-xl border border-stone-200 bg-white p-10 text-center text-stone-500">
              Carregando livros...
            </p>
          ) : listError ? (
            <div
              role="alert"
              className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700"
            >
              <p>Não foi possível carregar os livros: {listError}</p>
              <button
                type="button"
                onClick={reload}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <BookList
              books={books}
              onEdit={startEditing}
              onUpdatePrice={changePrice}
              onRemove={removeBook}
            />
          )}
        </section>
      </div>
    </div>
  );
}
