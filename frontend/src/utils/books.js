const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(price) {
  return priceFormatter.format(price);
}

export function filterByAuthor(books, term) {
  const search = term.trim().toLowerCase();
  if (search === "") {
    return books;
  }
  return books.filter((book) => book.author.toLowerCase().includes(search));
}

export function nextId(books) {
  return books.reduce((highest, book) => Math.max(highest, book.id), 0) + 1;
}
