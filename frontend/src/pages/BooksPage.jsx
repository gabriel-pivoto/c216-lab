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
    <div className="grid gap-6 lg:grid-cols-2">
      <BookForm onSubmit={addBook} />

      <section aria-labelledby="list-title" className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 id="list-title" className="text-lg font-semibold text-slate-800">
            Livros
          </h2>
          <span className="text-sm text-slate-500" data-testid="book-counter">
            {visibleBooks.length} de {books.length}
          </span>
        </div>
        <BookFilter value={filter} onChange={setFilter} />
        <BookList books={visibleBooks} onRemove={removeBook} />
      </section>
    </div>
  );
}
