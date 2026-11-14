# C216 Lab

Repositorio dos laboratorios e do projeto final da disciplina C216.

## Como usar

```bash
make help      # lista os alvos disponiveis
make install   # instala as dependencias com o poetry
make up-build  # sobe PostgreSQL, API em http://localhost:8000 e frontend em http://localhost:5173
make test      # roda os testes com o pytest (exige o PostgreSQL rodando)
make test-all  # sobe a stack e roda backend, frontend e E2E
```

`GET /` responde `{"status": "ok"}`. A documentacao interativa fica em `http://localhost:8000/docs`.

## Estrutura do backend

```
backend/
├── app/
│   ├── main.py            # apenas cria a aplicacao FastAPI
│   ├── api/
│   │   ├── cors.py        # CORS lido de CORS_ORIGINS
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
| `BACKEND_PORT`      | Porta publicada da API no Compose (padrao: `8000`) |
| `FRONTEND_PORT`     | Porta publicada do frontend no Compose (padrao: `5173`) |
| `CORS_ORIGINS`      | Origens liberadas no CORS, separadas por virgula (padrao: `http://localhost:5173,http://127.0.0.1:5173`) |
| `VITE_API_URL`      | URL da API como o navegador a enxerga (padrao: `http://localhost:8000`) |

Dentro do Docker Compose, o backend recebe `DATABASE_URL` apontando para o host `db`. `CORS_ORIGINS` e `VITE_API_URL` sao derivadas de `FRONTEND_PORT` e `BACKEND_PORT` quando nao sao informadas, entao trocar uma porta ja ocupada nao quebra a integracao.

Para rodar o Vite fora do Docker apontando para outra API, copie `frontend/.env.example` para `frontend/.env`.

## CORS

O CORS e configurado em `app/api/cors.py`:

- as origens sao explicitas e vem de `CORS_ORIGINS`; sem a variavel, o padrao e `http://localhost:5173` e `http://127.0.0.1:5173`;
- o curinga `*` e recusado na inicializacao;
- sao liberados os metodos `GET`, `POST`, `PUT`, `PATCH` e `DELETE` e o header `Content-Type`, sem credenciais.

## Executando a aplicacao

Com Docker Compose:

```bash
make up-build   # constroi as imagens e sobe PostgreSQL + API + frontend
make logs       # acompanha os logs
make down       # derruba os containers (os dados continuam no volume db-data)
```

| Servico    | Porta  | Papel |
|------------|--------|-------|
| `db`       | `5432` | PostgreSQL 16, com healthcheck `pg_isready` |
| `backend`  | `8000` | FastAPI; aplica as migrations ao subir e tem healthcheck em `GET /` |
| `frontend` | `5173` | Vite com hot reload (`frontend/src` montado como volume) |

Os servicos sobem em cascata: o backend espera o banco ficar saudavel e o frontend espera o backend ficar saudavel.

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
- `pratica-7`

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

SPA em React com Vite, escrita em JavaScript e estilizada com Tailwind CSS v4 (plugin do Vite, sem `tailwind.config.js`). A tela gerencia os livros da API, com os mesmos campos e regras do backend.

### Integracao com a API

| Acao na tela     | Chamada                               |
|------------------|---------------------------------------|
| Abrir a pagina   | `GET /books?limit=100`                |
| Buscar por autor | `GET /books?author=...`               |
| Cadastrar        | `POST /books`                         |
| Editar           | `GET /books/{id}` e `PUT /books/{id}` |
| Preco            | `PATCH /books/{id}` so com `price`    |
| Remover          | `DELETE /books/{id}`                  |

Depois de cada alteracao a lista e buscada de novo, para refletir o que esta no banco. O filtro por autor e feito pela API, que compara o nome completo sem diferenciar maiusculas.

O cliente `request` em `src/services/api.js` trata tres cenarios:

- API inacessivel: `ApiError` com status `0` e a mensagem "Nao foi possivel conectar a API...";
- resposta de erro: `ApiError` com o status e o `detail` do FastAPI (nos `422`, cada erro vem com o nome do campo);
- sucesso: o corpo JSON, ou `null` no `204` do `DELETE`.

A tela mostra um aviso de sucesso ou de erro em toda operacao. Se a lista nao carrega, aparece o botao "Tentar novamente". Num `404` (livro removido por outro cliente) a lista e recarregada.

```
frontend/
├── src/
│   ├── main.jsx           # monta o React no #root
│   ├── App.jsx            # layout da aplicacao
│   ├── index.css          # apenas @import "tailwindcss"
│   ├── pages/             # BooksPage carrega e altera os livros pela API
│   ├── components/        # formulario, filtro, lista e item da lista
│   ├── services/          # cliente HTTP (api.js) e endpoints de /books (books.js)
│   └── utils/             # funcoes puras: validacao e formatacao
├── tests/
│   ├── unit/              # cliente HTTP com fetch mockado, servico e componentes (Vitest)
│   ├── integration/       # pagina inteira com o servico mockado (Vitest + user-event)
│   └── e2e/               # fluxos no navegador contra a stack real (Playwright)
├── Dockerfile             # imagem do Vite usada pelo Compose
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

O `include` do Vitest aponta so para `tests/unit` e `tests/integration`, para nao executar os `*.spec.js` do Playwright.

Os testes E2E usam a stack real: navegador, Vite, FastAPI e PostgreSQL. Com `make up` rodando, o Playwright reaproveita a API e o Vite do Compose; sem eles, sobe a API com `poetry run uvicorn` e o Vite com `npm run dev`. Cada teste usa um autor unico, filtra a lista por ele e apaga pela API o que cadastrou, entao os dados de desenvolvimento nao sao afetados. Os cenarios cobrem o CRUD completo pela tela, a persistencia depois de recarregar a pagina, um `404` real da API, a validacao do formulario e a API fora do ar. O relatorio fica em `frontend/playwright-report/`.

Para rodar tudo de uma vez:

```bash
make front-e2e-install
make test-all   # sobe a stack e roda Pytest, Vitest e Playwright
```

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

O workflow `.github/workflows/ci-frontend.yml` roda quando algo em `frontend/`, em `backend/` ou o proprio workflow muda, porque os testes E2E usam a API real. Tem dois jobs:

- `lint`: `npm run check` (Biome);
- `test`: depende do `lint`, roda os testes unitarios, os de integracao e o build, instala o backend com Poetry, aplica as migrations num PostgreSQL 16 de service container e roda os testes E2E (o Playwright sobe a API e o Vite), publicando o relatorio do Playwright como artefato.
