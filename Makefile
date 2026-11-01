PYTHON      ?= python
POETRY      ?= $(shell $(PYTHON) -c "import shutil; print('poetry' if shutil.which('poetry') else '$(PYTHON) -m poetry')")
COMPOSE     ?= docker compose
BACKEND_DIR := backend
FRONTEND_DIR := frontend
NPM         ?= npm
APP         := app.main:app
HOST        ?= 0.0.0.0
PORT        ?= 8000

.DEFAULT_GOAL := help

.PHONY: help install run format lint test test-unit test-integration \
        migrate migration downgrade db-current build up up-build down down-volumes logs db-shell \
        front-install front-dev front-build front-format front-lint front-test \
        front-test-unit front-test-integration front-e2e-install front-test-e2e

help:
	@echo "Alvos disponiveis:"
	@echo "  help              Mostra esta mensagem"
	@echo "  install           Instala as dependencias com o poetry"
	@echo "  run               Sobe a API local em http://$(HOST):$(PORT)"
	@echo "  format            Formata o codigo e organiza os imports com o ruff"
	@echo "  lint              Verifica lint e formatacao sem alterar arquivos"
	@echo "  test              Roda todos os testes (exige o PostgreSQL: make up)"
	@echo "  test-unit         Roda apenas os testes unitarios"
	@echo "  test-integration  Roda apenas os testes de integracao (exige o PostgreSQL)"
	@echo "  migrate           Aplica as migrations pendentes"
	@echo "  migration M=msg   Gera uma migration a partir dos modelos ORM"
	@echo "  downgrade         Desfaz a ultima migration"
	@echo "  db-current        Mostra a revisao atual do banco"
	@echo "  build             Constroi as imagens do compose"
	@echo "  up                Sobe os servicos do compose em segundo plano"
	@echo "  up-build          Reconstroi as imagens e sobe os servicos"
	@echo "  down              Derruba os servicos do compose, mantendo os dados"
	@echo "  down-volumes      Derruba os servicos e apaga os dados do banco"
	@echo "  logs              Acompanha os logs dos servicos"
	@echo "  db-shell          Abre o psql no container do banco"
	@echo "  front-install           Instala as dependencias do frontend"
	@echo "  front-dev               Roda o Vite em http://localhost:5173"
	@echo "  front-build             Gera o build de producao em frontend/dist"
	@echo "  front-format            Formata o codigo e organiza os imports com o Biome"
	@echo "  front-lint              Verifica lint, formatacao e imports sem alterar arquivos"
	@echo "  front-test              Roda os testes unitarios e de integracao (Vitest)"
	@echo "  front-test-unit         Roda apenas os testes unitarios do frontend"
	@echo "  front-test-integration  Roda apenas os testes de integracao do frontend"
	@echo "  front-e2e-install       Instala o Chromium usado pelo Playwright"
	@echo "  front-test-e2e          Roda os testes E2E (exige a aplicacao no ar: make up-build)"

install:
	cd $(BACKEND_DIR) && $(POETRY) install

run:
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn $(APP) --host $(HOST) --port $(PORT) --reload

format:
	cd $(BACKEND_DIR) && $(POETRY) run ruff check --fix .
	cd $(BACKEND_DIR) && $(POETRY) run ruff format .

lint:
	cd $(BACKEND_DIR) && $(POETRY) run ruff check .
	cd $(BACKEND_DIR) && $(POETRY) run ruff format --check .

test:
	cd $(BACKEND_DIR) && $(POETRY) run pytest

test-unit:
	cd $(BACKEND_DIR) && $(POETRY) run pytest tests/unit

test-integration:
	cd $(BACKEND_DIR) && $(POETRY) run pytest tests/integration

migrate:
	cd $(BACKEND_DIR) && $(POETRY) run alembic upgrade head

migration:
	cd $(BACKEND_DIR) && $(POETRY) run alembic revision --autogenerate -m "$(M)"

downgrade:
	cd $(BACKEND_DIR) && $(POETRY) run alembic downgrade -1

db-current:
	cd $(BACKEND_DIR) && $(POETRY) run alembic current

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

up-build:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

down-volumes:
	$(COMPOSE) down -v

logs:
	$(COMPOSE) logs -f

db-shell:
	$(COMPOSE) exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

front-install:
	cd $(FRONTEND_DIR) && $(NPM) ci

front-dev:
	cd $(FRONTEND_DIR) && $(NPM) run dev

front-build:
	cd $(FRONTEND_DIR) && $(NPM) run build

front-format:
	cd $(FRONTEND_DIR) && $(NPM) run format

front-lint:
	cd $(FRONTEND_DIR) && $(NPM) run check

front-test:
	cd $(FRONTEND_DIR) && $(NPM) run test

front-test-unit:
	cd $(FRONTEND_DIR) && $(NPM) run test:unit

front-test-integration:
	cd $(FRONTEND_DIR) && $(NPM) run test:integration

front-e2e-install:
	cd $(FRONTEND_DIR) && $(NPM) run test:e2e:install

front-test-e2e:
	cd $(FRONTEND_DIR) && $(NPM) run test:e2e
