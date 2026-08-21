PYTHON      ?= python
POETRY      ?= $(shell $(PYTHON) -c "import shutil; print('poetry' if shutil.which('poetry') else '$(PYTHON) -m poetry')")
BACKEND_DIR := backend
APP         := app.main:app
HOST        ?= 0.0.0.0
PORT        ?= 8000

.DEFAULT_GOAL := help

.PHONY: help install run

help:
	@echo "Alvos disponiveis:"
	@echo "  help     Mostra esta mensagem"
	@echo "  install  Instala as dependencias com o poetry"
	@echo "  run      Sobe a API em http://$(HOST):$(PORT)"

install:
	cd $(BACKEND_DIR) && $(POETRY) install

run:
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn $(APP) --host $(HOST) --port $(PORT) --reload
