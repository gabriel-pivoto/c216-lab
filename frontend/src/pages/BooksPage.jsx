import { useState } from "react";
import BookFilter from "../components/BookFilter.jsx";
import BookForm from "../components/BookForm.jsx";
import BookList from "../components/BookList.jsx";
import { filterByAuthor, nextId } from "../utils/books.js";

export default function BooksPage({ initialBooks = [] }) {
  const [books, setBooks] = useState(initialBooks);
  const [filter, setFilter] = useState("");

  function addBook(book) {
    setBooks((previous) => [...previous, { ...book, id: nextId(previous) }]);
  }

  function removeBook(id) {
    setBooks((previous) => previous.filter((book) => book.id !== id));
  }

  const visibleBooks = filterByAuthor(books, filter);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <BookForm onSubmit={addBook} />
      </div>

      <section aria-labelledby="list-title" className="space-y-5 lg:col-span-3">
        <div className="flex items-center justify-between">
          <h2 id="list-title" className="text-xl font-semibold text-stone-900">
            Livros
          </h2>
          <span
            className="rounded-full bg-stone-200 px-3 py-1 text-sm font-medium text-stone-700"
            data-testid="book-counter"
          >
            {visibleBooks.length} de {books.length}
          </span>
        </div>
        <BookFilter value={filter} onChange={setFilter} />
        <BookList books={visibleBooks} onRemove={removeBook} />
      </section>
    </div>
  );
}
