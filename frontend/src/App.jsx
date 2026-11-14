import BooksPage from "./pages/BooksPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Gerenciador de Livros
          </h1>
          <p className="text-sm text-stone-500">Cadastre, filtre e organize seu acervo</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <BooksPage />
      </main>
    </div>
  );
}
