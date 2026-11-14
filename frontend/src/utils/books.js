const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(price) {
  return priceFormatter.format(price);
}

export function toFormValues(book) {
  return {
    title: book.title,
    author: book.author,
    year: String(book.year),
    pages: String(book.pages),
    genre: book.genre,
    price: String(book.price),
  };
}
