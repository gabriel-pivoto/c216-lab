PYTHON      ?= python
POETRY      ?= $(shell $(PYTHON) -c "import shutil; print('poetry' if shutil.which('poetry') else '$(PYTHON) -m poetry')")
COMPOSE     ?= docker compose
BACKEND_DIR := backend
APP         := app.main:app
HOST        ?= 0.0.0.0
PORT        ?= 8000

.DEFAULT_GOAL := help

.PHONY: help install run format lint test test-unit test-integration \
        migrate migration downgrade db-current build up up-build down logs db-shell

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
	@echo "  down              Derruba os servicos do compose"
	@echo "  logs              Acompanha os logs dos servicos"
	@echo "  db-shell          Abre o psql no container do banco"

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

logs:
	$(COMPOSE) logs -f

db-shell:
	$(COMPOSE) exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'
