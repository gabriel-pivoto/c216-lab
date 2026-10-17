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

## Checklist antes do PR

```bash
make format
make lint
make test
make up-build
```

## CI

O workflow `.github/workflows/ci-backend.yml` roda a cada `push` e `pull_request` com dois jobs:

- `lint`: `ruff check .` e `ruff format --check .`;
- `test`: sobe um PostgreSQL 16 como service container, roda os testes unitarios, aplica as migrations e roda os testes de integracao.
