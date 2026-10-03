# C216 Lab

Repositorio dos laboratorios e do projeto final da disciplina C216.

## Como usar

```bash
make help      # lista os alvos disponiveis
make install   # instala as dependencias com o poetry
make run       # sobe a API em http://localhost:8000
make test      # roda os testes com o pytest
```

`GET /` responde `{"status": "ok"}`. A documentacao interativa fica em `http://localhost:8000/docs`.

## Estrutura do backend

```
backend/
├── app/
│   ├── main.py            # apenas cria a aplicacao FastAPI
│   ├── api/
│   │   ├── router.py      # junta os routers
│   │   └── routes/        # endpoints HTTP (health, books)
│   ├── schemas/           # modelos Pydantic (book)
│   └── services/          # regras de negocio (book)
└── tests/
    ├── unit/              # testes de schemas e services, sem HTTP
    └── integration/       # testes dos endpoints via TestClient
```

## Endpoints de livros

Ainda nao ha banco de dados: os services apenas montam e devolvem valores.

| Metodo | Rota               | Parametros                          | Resposta            |
|--------|--------------------|-------------------------------------|---------------------|
| GET    | `/books`           | query `author`, `limit` (1 a 100)   | 200 lista de `Book` |
| GET    | `/books/{book_id}` | path `book_id` (> 0)                | 200 `Book`          |
| POST   | `/books`           | corpo `BookCreate`                  | 201 `Book`          |
| PUT    | `/books/{book_id}` | path `book_id` + corpo `BookUpdate` | 200 `Book`          |
| PATCH  | `/books/{book_id}` | path `book_id` + corpo `BookPatch`  | 200 `Book`          |
| DELETE | `/books/{book_id}` | path `book_id`                      | 204 sem corpo       |

Um livro tem os campos `title`, `author`, `year`, `pages`, `genre` e `price`.

## Branches

- `main`
- `aulas`
- `projeto-final`
- `pratica-1`
- `pratica-2`
- `pratica-3`
- `pratica-4`

## Testes

Os testes ficam em `backend/tests`, separados em duas suites:

- `tests/unit/`: testam os schemas Pydantic e os services diretamente, sem camada HTTP;
- `tests/integration/`: testam os endpoints via `TestClient` do FastAPI.

Cada teste recebe o marker `unit` ou `integration` conforme a pasta, e o pytest recusa testes fora dessas duas pastas.

```bash
make test              # roda toda a suite
make test-unit         # roda apenas os testes unitarios
make test-integration  # roda apenas os testes de integracao
```

Para rodar direto pelo poetry:

```bash
cd backend
poetry run pytest
poetry run pytest tests/unit
poetry run pytest -m integration
```

O workflow `.github/workflows/ci-backend.yml` roda as duas suites em passos separados no GitHub Actions a cada `push` e `pull_request`.
