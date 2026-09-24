# C216 Lab

Repositorio dos laboratorios e do projeto final da disciplina C216.

## Como usar

```bash
make help      # lista os alvos disponiveis
make install   # instala as dependencias com o poetry
make run       # sobe a API em http://localhost:8000
make test      # roda os testes com o pytest
```

`GET /` responde `{"status": "ok"}`.

## Branches

- `main`
- `aulas`
- `projeto-final`
- `pratica-1`
- `pratica-2`

## Testes

Os testes ficam em `backend/tests` e rodam com o pytest:

```bash
make test
```

Para rodar direto pelo poetry:

```bash
cd backend
poetry run pytest
```

O workflow `.github/workflows/ci-backend.yml` roda os mesmos testes no GitHub Actions a cada `push` e `pull_request`.
