# C216 Lab

Repositorio dos laboratorios e do projeto final da disciplina C216.

## Como usar

```bash
make help      # lista os alvos disponiveis
make install   # instala as dependencias com o poetry
make up-build  # sobe PostgreSQL + API em http://localhost:8000 e aplica as migrations
make test      # roda os testes com o pytest (exige o PostgreSQL rodando)
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
│   ├── schemas/           # schemas Pydantic (entrada e saida da API)
│   ├── services/          # regras de negocio (usam os repositories)
│   ├── repositories/      # acesso aos dados via SQLAlchemy
│   ├── models/            # modelos ORM do SQLAlchemy
│   └── database/          # configuracao, engine, sessao e Base declarativa
├── alembic/
│   ├── env.py             # le DATABASE_URL e os modelos ORM
│   └── versions/          # migrations do banco
├── alembic.ini            # configuracao do Alembic
└── tests/
    ├── unit/              # schemas, services e config, sem HTTP nem banco
    └── integration/       # endpoints, repository e migrations no PostgreSQL
```

### Camadas

```
rota (api/routes)  ->  service (services)  ->  repository (repositories)  ->  PostgreSQL
  schemas Pydantic       regras de negocio        modelos ORM (models)
```

- As rotas recebem e devolvem schemas Pydantic e obtem o service via `Depends`.
- O service aplica as regras (livro inexistente gera `BookNotFoundError`, que a rota devolve como `404`) e converte os modelos ORM em schemas com `Book.model_validate`.
- O repository e a unica camada que conhece o SQLAlchemy.
- Os modelos ORM (`app/models`) ficam separados dos schemas Pydantic (`app/schemas`).

## Configuracao

Copie o arquivo de exemplo de variaveis de ambiente:

```bash
cp .env.example .env
```

| Variavel            | Uso |
|---------------------|-----|
| `DATABASE_URL`      | Conexao da aplicacao e do Alembic (padrao: `postgresql+psycopg://c216:c216@localhost:5432/c216`) |
| `TEST_DATABASE_URL` | Banco usado pelos testes de integracao (padrao: `c216_test`) |

Dentro do Docker Compose, o backend recebe `DATABASE_URL` apontando para o host `db`.

## Executando a aplicacao

Com Docker Compose:

```bash
make up-build   # constroi a imagem e sobe PostgreSQL + API
make logs       # acompanha os logs
make down       # derruba os containers (os dados continuam no volume db-data)
```

Ao subir, o container do backend executa `alembic upgrade head` antes do Uvicorn, entao o banco sempre esta com todas as migrations aplicadas. Os dados ficam no volume `db-data` e continuam la depois de reiniciar a API.

Localmente:

```bash
make up         # garante o PostgreSQL rodando na porta 5432
make migrate    # aplica as migrations no banco de DATABASE_URL
make run        # sobe a API com reload em http://localhost:8000
```

## Migrations (Alembic)

```bash
make migrate                     # alembic upgrade head
make migration M="add isbn"      # gera uma migration a partir dos modelos ORM (autogenerate)
make downgrade                   # desfaz a ultima migration
make db-current                  # mostra a revisao atual do banco
```

A URL do banco nao fica no `alembic.ini`: o `alembic/env.py` usa a mesma `DATABASE_URL` da aplicacao. As migrations geradas passam automaticamente pelo Ruff.

## Endpoints de livros

Os dados ficam na tabela `books` do PostgreSQL.

| Metodo | Rota               | Parametros                          | Resposta                  |
|--------|--------------------|-------------------------------------|---------------------------|
| GET    | `/books`           | query `author`, `limit` (1 a 100)   | 200 lista de `Book`       |
| GET    | `/books/{book_id}` | path `book_id` (> 0)                | 200 `Book` ou 404         |
| POST   | `/books`           | corpo `BookCreate`                  | 201 `Book`                |
| PUT    | `/books/{book_id}` | path `book_id` + corpo `BookUpdate` | 200 `Book` ou 404         |
| PATCH  | `/books/{book_id}` | path `book_id` + corpo `BookPatch`  | 200 `Book` ou 404         |
| DELETE | `/books/{book_id}` | path `book_id`                      | 204 sem corpo ou 404      |

Um livro tem os campos `title`, `author`, `year`, `pages`, `genre` e `price`.

## Branches

- `main`
- `aulas`
- `projeto-final`
- `pratica-1`
- `pratica-2`
- `pratica-3`
- `pratica-4`
- `pratica-5`
- `pratica-6`

## Qualidade de codigo

```bash
make format   # ruff check --fix + ruff format
make lint     # ruff check + ruff format --check (nao altera arquivos)
```

A configuracao do Ruff fica em `[tool.ruff]` no `backend/pyproject.toml`.

## Testes

Os testes ficam em `backend/tests`, separados em duas suites:

- `tests/unit/`: testam os schemas, o service (com um repository falso em memoria) e a leitura da configuracao, sem HTTP e sem banco;
- `tests/integration/`: testam os endpoints via `TestClient`, o repository e as migrations contra um PostgreSQL real.

Os testes de integracao usam um banco separado (`TEST_DATABASE_URL`, por padrao `c216_test`), que e criado automaticamente, recebe as migrations via Alembic e tem a tabela `books` limpa antes de cada teste. Um deles falha se um modelo ORM mudar sem uma migration nova. Por isso o PostgreSQL precisa estar rodando (`make up`) antes de `make test`.

Cada teste recebe o marker `unit` ou `integration` conforme a pasta, e o pytest recusa testes fora dessas duas pastas.

```bash
make up                # sobe o PostgreSQL
make test              # roda toda a suite
make test-unit         # roda apenas os testes unitarios (nao precisa de banco)
make test-integration  # roda apenas os testes de integracao
```

Para rodar direto pelo poetry:

```bash
cd backend
poetry run pytest
poetry run pytest tests/unit
poetry run pytest -m integration
```

## Frontend

SPA em React com Vite, escrita em JavaScript e estilizada com Tailwind CSS v4 (plugin do Vite, sem `tailwind.config.js`). A tela gerencia livros com os mesmos campos e regras do backend: cadastrar, filtrar por autor e remover.

Nesta pratica o estado e apenas local (`useState`): nao ha chamadas a API nem persistencia, entao a lista volta aos livros de exemplo ao recarregar a pagina.

```
frontend/
├── src/
│   ├── main.jsx           # monta o React no #root
│   ├── App.jsx            # layout e livros de exemplo
│   ├── index.css          # apenas @import "tailwindcss"
│   ├── pages/             # BooksPage guarda o estado dos livros
│   ├── components/        # formulario, lista e filtro
│   └── utils/             # funcoes puras: validacao, filtro, formatacao e id
├── tests/
│   ├── unit/              # funcoes puras e componentes isolados (Vitest)
│   ├── integration/       # formulario, filtro e lista juntos (Vitest + user-event)
│   └── e2e/               # fluxos no navegador (Playwright)
├── vite.config.js         # Vite, plugins e configuracao do Vitest
├── playwright.config.js   # navegador, servidor e relatorio dos testes E2E
└── biome.json             # regras de lint e formatacao
```

A validacao do formulario segue o `BookBase` do backend:

- `title` de 1 a 200 caracteres, `author` de 1 a 100 e `genre` de 1 a 50;
- `year` inteiro entre 1450 e 2100;
- `pages` inteiro maior que zero;
- `price` maior que zero.

| Ferramenta                       | Papel                                 | Equivalente no backend |
|----------------------------------|---------------------------------------|------------------------|
| npm                              | Dependencias e scripts                | Poetry                 |
| Biome                            | Lint, formatacao e ordem dos imports  | Ruff                   |
| Vitest + Testing Library + jsdom | Testes unitarios e de integracao      | Pytest + TestClient    |
| Playwright (Chromium)            | Testes E2E em navegador real          | -                      |

Requer Node.js 22.12 ou superior.

```bash
make front-install           # npm ci
make front-dev               # Vite em http://localhost:5173
make front-build             # build de producao em frontend/dist
make front-preview           # serve o build localmente
make front-format            # biome check --write
make front-lint              # biome check, sem alterar arquivos
make front-test              # testes unitarios e de integracao
make front-test-unit         # apenas os unitarios
make front-test-integration  # apenas os de integracao
make front-e2e-install       # instala o Chromium do Playwright
make front-test-e2e          # testes E2E
```

O `include` do Vitest aponta so para `tests/unit` e `tests/integration`, para nao executar os `*.spec.js` do Playwright. O Playwright sobe o Vite sozinho e gera o relatorio em `frontend/playwright-report/`.

## Checklist antes do PR

```bash
make format
make lint
make test
make front-format
make front-lint
make front-test
make front-test-e2e
make up-build
```

## CI

O workflow `.github/workflows/ci-backend.yml` roda a cada `push` e `pull_request` com dois jobs:

- `lint`: `ruff check .` e `ruff format --check .`;
- `test`: sobe um PostgreSQL 16 como service container, roda os testes unitarios, aplica as migrations e roda os testes de integracao.

O workflow `.github/workflows/ci-frontend.yml` roda quando algo em `frontend/` ou o proprio workflow muda, com dois jobs:

- `lint`: `npm run check` (Biome);
- `test`: depende do `lint` e roda os testes unitarios, os de integracao, o build e os testes E2E, publicando o relatorio do Playwright como artefato.
