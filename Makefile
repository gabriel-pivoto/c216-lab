PYTHON      ?= python
POETRY      ?= $(shell $(PYTHON) -c "import shutil; print('poetry' if shutil.which('poetry') else '$(PYTHON) -m poetry')")
COMPOSE     ?= docker compose
BACKEND_DIR := backend
APP         := app.main:app
HOST        ?= 0.0.0.0
PORT        ?= 8000

.DEFAULT_GOAL := help

.PHONY: help install run test test-unit test-integration build up down logs shell db-shell

help:
	@echo "Alvos disponiveis:"
	@echo "  help      Mostra esta mensagem"
	@echo "  install   Instala as dependencias com o poetry"
	@echo "  run       Sobe a API local em http://$(HOST):$(PORT)"
	@echo "  test      Roda os testes com o pytest"
	@echo "  test-unit         Roda apenas os testes unitarios"
	@echo "  test-integration  Roda apenas os testes de integracao"
	@echo "  build     Constroi as imagens do compose"
	@echo "  up        Sobe os servicos do compose em segundo plano"
	@echo "  down      Derruba os servicos do compose"
	@echo "  logs      Acompanha os logs dos servicos"
	@echo "  shell     Abre um shell no container do backend"
	@echo "  db-shell  Abre o psql no container do banco"

install:
	cd $(BACKEND_DIR) && $(POETRY) install

run:
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn $(APP) --host $(HOST) --port $(PORT) --reload

test:
	cd $(BACKEND_DIR) && $(POETRY) run pytest

test-unit:
	cd $(BACKEND_DIR) && $(POETRY) run pytest tests/unit

test-integration:
	cd $(BACKEND_DIR) && $(POETRY) run pytest tests/integration

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

shell:
	$(COMPOSE) exec backend bash

db-shell:
	$(COMPOSE) exec db psql -U c216 -d c216
