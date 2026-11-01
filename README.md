# SalaCerta

Sistema de reserva de salas e laboratórios, desenvolvido como Projeto Final da disciplina C216.

> Em desenvolvimento. Este README descreve apenas o que já está implementado.

## Funcionalidades

- Cadastro, consulta, edição e exclusão de salas, com nome único, tipo, localização, capacidade e recursos.
- Filtro de salas por tipo, capacidade mínima e recursos.

## Como executar

Copie as variáveis de ambiente e suba os serviços:

```bash
cp .env.example .env
make up-build
```

A API fica em `http://localhost:8000` e a documentação interativa em `http://localhost:8000/docs`. As migrations são aplicadas quando o contêiner do backend inicia.

## Variáveis de ambiente

| Variável            | Uso |
|---------------------|-----|
| `POSTGRES_USER`     | Usuário do PostgreSQL no Compose |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL no Compose |
| `POSTGRES_DB`       | Banco criado no Compose |
| `DATABASE_URL`      | Conexão da aplicação e do Alembic fora do Compose |
| `TEST_DATABASE_URL` | Banco dos testes de integração, criado automaticamente |

## Endpoints de salas

| Método | Rota          | Parâmetros                               | Resposta             |
|--------|---------------|------------------------------------------|----------------------|
| GET    | `/rooms`      | query `kind`, `min_capacity`, `resource` | 200 lista de salas   |
| GET    | `/rooms/{id}` | path `id`                                | 200 sala ou 404      |
| POST   | `/rooms`      | corpo com os dados da sala               | 201 sala ou 409      |
| PUT    | `/rooms/{id}` | path `id` e corpo com os dados da sala   | 200 sala, 404 ou 409 |
| DELETE | `/rooms/{id}` | path `id`                                | 204 sem corpo ou 404 |

## Comandos

```bash
make help              # lista todos os alvos
make install           # instala as dependências do backend
make format            # formata o código com o Ruff
make lint              # verifica lint e formatação
make up                # sobe os serviços
make down              # derruba os serviços, mantendo os dados
make test              # roda todos os testes (exige o PostgreSQL)
make test-unit         # roda os testes unitários
make test-integration  # roda os testes de integração (exige o PostgreSQL)
make migrate           # aplica as migrations
make migration M="msg" # gera uma migration a partir dos modelos
make downgrade         # desfaz a última migration
```
