# SalaCerta

Sistema web de reserva de salas e laboratórios, desenvolvido como Projeto Final da disciplina C216 (Sistemas Distribuídos).

**Vídeo demonstrativo:** _link a ser adicionado antes da entrega._

## Objetivo

Instituições com salas compartilhadas costumam controlar reservas em planilhas ou mensagens, o que gera horários duplicados e dificulta saber o que está livre. O SalaCerta centraliza o cadastro das salas e o pedido de reservas, impede conflitos de horário e dá visibilidade da ocupação.

## Funcionalidades

- **Salas:** cadastro, consulta, edição e exclusão, com tipo, localização, capacidade e recursos, além de filtros.
- **Reservas:** cadastro, consulta, edição e exclusão, com filtros por status, sala e e-mail do solicitante.
- **Aprovação:** a reserva nasce pendente e pode ser aprovada, rejeitada ou cancelada.
- **Salas livres:** busca por período, participantes, tipo e recursos, com atalho para reservar a sala encontrada.
- **Reservas semanais:** repete uma reserva por 2 a 12 semanas. Se uma das datas tiver conflito, nenhuma é criada. A série pode ser cancelada de uma vez.
- **Agenda semanal:** grade por sala, com navegação entre semanas.
- **Painel:** reservas pendentes, reservas do dia, ocupação do dia e salas mais usadas, com aprovação direta.

## Regras de negócio

| Regra | Comportamento |
|-------|---------------|
| Conflito de horário | Pendentes e aprovadas bloqueiam o horário da sala. Rejeitadas e canceladas liberam. Retorna 409. |
| Horário de funcionamento | Reservas entre 07:00 e 23:00, com início e término no mesmo dia. |
| Duração | De 30 minutos a 4 horas. |
| Passado | Não é possível criar nem editar reservas para um horário que já passou. |
| Capacidade | O número de participantes não pode passar da capacidade da sala. |
| Edição | Apenas reservas pendentes podem ser editadas. |
| Exclusão de reserva | Reservas aprovadas precisam ser canceladas antes de serem excluídas. |
| Transições | Pendente vai para aprovada, rejeitada ou cancelada. Aprovada vai apenas para cancelada. Depois de iniciada, uma reserva não pode ser aprovada e, se aprovada, não pode ser cancelada. |
| Exclusão de sala | Sala com reserva futura ativa não pode ser excluída. Ao excluir uma sala sem reservas futuras ativas, as demais reservas dela são apagadas. |
| Redução de capacidade | A capacidade não pode ficar abaixo dos participantes de uma reserva futura ativa. |

### Concorrência

Dois pedidos simultâneos para o mesmo horário não geram reserva duplicada, por duas proteções:

- o service bloqueia a linha da sala (`SELECT ... FOR UPDATE`) antes de verificar conflitos;
- a tabela `reservations` tem uma restrição `EXCLUDE USING gist`, que faz o próprio PostgreSQL recusar períodos sobrepostos na mesma sala.

## Tecnologias

| Parte | Ferramentas |
|-------|-------------|
| Backend | Python 3.12, FastAPI, Pydantic, SQLAlchemy, Alembic, Poetry, Ruff, Pytest |
| Banco de dados | PostgreSQL 16 |
| Frontend | React, JavaScript, Vite, Tailwind CSS, Biome, Vitest, Testing Library, Playwright |
| Infraestrutura | Docker, Docker Compose, Nginx, Makefile, GitHub Actions |

## Estrutura

```
backend/
├── app/
│   ├── api/            # rotas HTTP e conversão de erros de domínio em respostas
│   ├── domain/         # enums, erros, relógio e regras de reserva
│   ├── schemas/        # entrada e saída da API (Pydantic)
│   ├── services/       # casos de uso e aplicação das regras
│   ├── repositories/   # consultas com SQLAlchemy
│   ├── models/         # tabelas (ORM)
│   └── database/       # conexão e sessão
├── alembic/            # migrations versionadas
└── tests/              # unit/ e integration/
frontend/
├── src/
│   ├── api/            # chamadas HTTP
│   ├── hooks/          # carregamento de dados com estados de loading e erro
│   ├── pages/          # Painel, Reservas, Salas livres, Agenda e Salas
│   ├── components/     # formulários, listas, agenda e mensagens
│   └── utils/          # datas, validação e rótulos
└── tests/              # unit/, integration/ e e2e/
```

O fluxo de uma requisição é `rota -> service -> repository -> PostgreSQL`. O navegador acessa o frontend servido pelo Nginx e chama a API diretamente, por isso a API libera a origem do frontend via CORS.

## Pré-requisitos

- Docker com Docker Compose
- Make

Para rodar os testes e o desenvolvimento fora dos contêineres, também é preciso ter Python 3.12 ou superior, Poetry e Node.js 22.12 ou superior.

## Variáveis de ambiente

Copie o arquivo de exemplo e, se quiser, troque a senha nas três variáveis que a usam:

```bash
cp .env.example .env
```

| Variável            | Uso |
|---------------------|-----|
| `POSTGRES_USER`     | Usuário do PostgreSQL no Compose |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL no Compose |
| `POSTGRES_DB`       | Banco criado no Compose |
| `DATABASE_URL`      | Conexão da API e do Alembic fora do Compose |
| `TEST_DATABASE_URL` | Banco dos testes de integração, criado automaticamente |
| `APP_TIMEZONE`      | Fuso usado nas regras de horário (padrão `America/Sao_Paulo`) |
| `CORS_ORIGINS`      | Origens aceitas pela API, separadas por vírgula |
| `VITE_API_URL`      | Endereço da API usado no build do frontend |

## Como executar

```bash
cp .env.example .env
make up-build
```

| Serviço | Endereço |
|---------|----------|
| Aplicação | http://localhost:5173 |
| API | http://localhost:8000 |
| Documentação da API | http://localhost:8000/docs |

As portas 5173, 8000 e 5432 precisam estar livres. Os dados ficam no volume `db-data` e continuam disponíveis depois de `make down`. Para apagá-los, use `make down-volumes`.

Para desenvolver fora dos contêineres:

```bash
make install        # dependências do backend
make front-install  # dependências do frontend
docker compose up -d db
make migrate
make run            # API em http://localhost:8000
make front-dev      # frontend em http://localhost:5173
```

## Migrações

As migrations são aplicadas automaticamente quando o contêiner do backend inicia. Fora dele:

```bash
make migrate                 # aplica as migrations
make migration M="mensagem"  # gera uma migration a partir dos modelos
make downgrade               # desfaz a última migration
make db-current              # mostra a revisão atual
```

## Testes

```bash
docker compose up -d db
make test              # backend: unitários e integração no PostgreSQL
make test-unit         # backend: apenas unitários, sem banco
make test-integration  # backend: apenas integração

make front-test        # frontend: unitários e integração
make front-test-unit
make front-test-integration

make up-build          # sobe a aplicação completa
make front-e2e-install # instala o Chromium, apenas na primeira vez
make front-test-e2e    # E2E no navegador, contra frontend, API e PostgreSQL reais
```

Os testes E2E criam dados com nomes únicos no banco da aplicação. Para limpar depois, use `make down-volumes`.

## Qualidade

```bash
make format        # Ruff: formata o backend
make lint          # Ruff: verifica sem alterar
make front-format  # Biome: formata o frontend
make front-lint    # Biome: verifica sem alterar
```

## Integração contínua

| Workflow | Quando roda | O que faz |
|----------|-------------|-----------|
| `ci-backend.yml` | Mudanças em `backend/` | Ruff, testes unitários, migrations e testes de integração com PostgreSQL |
| `ci-frontend.yml` | Mudanças em `frontend/` | Biome, testes unitários, testes de integração e build |
| `ci-e2e.yml` | Mudanças em `backend/`, `frontend/` ou no Compose | Sobe tudo com Docker Compose e roda o Playwright |

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Verificação de saúde |
| GET, POST | `/rooms` | Lista (filtros `kind`, `min_capacity`, `resource`) e cria salas |
| GET | `/rooms/available` | Salas livres (`starts_at`, `ends_at`, `attendees`, `kind`, `resource`) |
| GET, PUT, DELETE | `/rooms/{id}` | Consulta, substitui e exclui uma sala |
| GET, POST | `/reservations` | Lista (filtros `room_id`, `status`, `requester_email`, `date_from`, `date_to`, `limit`) e cria reservas |
| POST | `/reservations/recurring` | Cria uma série semanal |
| POST | `/reservations/series/{id}/cancel` | Cancela as próximas reservas ativas da série |
| GET, PUT, DELETE | `/reservations/{id}` | Consulta, substitui e exclui uma reserva |
| POST | `/reservations/{id}/approve` | Aprova |
| POST | `/reservations/{id}/reject` | Rejeita |
| POST | `/reservations/{id}/cancel` | Cancela |
| GET | `/dashboard/summary` | Indicadores do painel |

Os erros usam `404` para recurso inexistente, `409` para conflito com o estado atual e `422` para dados inválidos ou regra de negócio violada.
