import BookItem from "./BookItem.jsx";

export default function BookList({ books, onEdit, onUpdatePrice, onRemove }) {
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
        <BookItem
          key={book.id}
          book={book}
          onEdit={onEdit}
          onUpdatePrice={onUpdatePrice}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}
