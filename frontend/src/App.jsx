import BooksPage from "./pages/BooksPage.jsx";

const SAMPLE_BOOKS = [
  {
    id: 1,
    title: "Dom Casmurro",
    author: "Machado de Assis",
    year: 1899,
    pages: 256,
    genre: "Romance",
    price: 39.9,
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    year: 1949,
    pages: 328,
    genre: "Distopia",
    price: 49.9,
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <h1 className="text-2xl font-bold">Gerenciador de Livros</h1>
          <p className="text-sm text-slate-300">C216 · Prática 6</p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <BooksPage initialBooks={SAMPLE_BOOKS} />
      </main>
    </div>
  );
}
