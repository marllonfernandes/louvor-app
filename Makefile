# ==============================================================================
# Makefile - Louvor App (Ministério de Louvor)
# Google Cloud Run + Firestore + Frontend Mobile Nativo + Backend Node.js
# ==============================================================================

SHELL := /bin/bash
GCP_PROJECT ?= lab-resources
GCP_REGION ?= southamerica-east1
SERVICE_NAME ?= louvor-app
LOCATION ?= $(GCP_REGION)
IMAGE_TAG ?= us-docker.pkg.dev/$(GCP_PROJECT)/$(SERVICE_NAME)/$(SERVICE_NAME):latest
PORT ?= 8080
SERVICE_ACCOUNT ?= sa-louvor-app@$(GCP_PROJECT).iam.gserviceaccount.com

# Chave Web API do Google Cloud / Firebase (formato AIzaSy...)
# Pode ser definida no shell: export VITE_FIREBASE_API_KEY=AIzaSy... ou passada no comando make deploy-gcp VITE_FIREBASE_API_KEY=AIzaSy...

# credentials -> API Keys
# firestore-louvor-app-frontend
VITE_FIREBASE_API_KEY ?= AIzaSyARTvIk7qOuh2UCLBvPPkhIUkfMYs9Nr74

# Variáveis do Firestore para Build
FIREBASE_PROJECT_ID ?= $(GCP_PROJECT)
FIREBASE_API_KEY ?= $(VITE_FIREBASE_API_KEY)
FIREBASE_DATABASE_ID ?= app-unida

.PHONY: help install install-front install-back dev dev-front dev-back build build-front copy-front build-back run-local start docker-build docker-run deploy-gcp clean

# ------------------------------------------------------------------------------
# AJUDA / COMANDOS DISPONÍVEIS
# ------------------------------------------------------------------------------
help:
	@echo "╔═════════════════════════════════════════════════════════════════════════════╗"
	@echo "║                       LOUVOR APP - COMANDOS MAKEFILE                       ║"
	@echo "╚═════════════════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  \033[1;32mInstalação e Desenvolvimento:\033[0m"
	@echo "    make install          - Instala dependências do Frontend e Backend"
	@echo "    make dev-front        - Executa o frontend em modo Dev (Vite na porta 5173)"
	@echo "    make dev-back         - Executa o backend em modo Dev (Node.js/Express)"
	@echo "    make dev              - Instruções para executar em paralelo"
	@echo ""
	@echo "  \033[1;34mBuild e Sincronização:\033[0m"
	@echo "    make build-front      - Compila o frontend React (frontend/dist)"
	@echo "    make copy-front       - Copia o build do frontend para o backend (backend/public)"
	@echo "    make build-back       - Compila o backend TypeScript (backend/dist)"
	@echo "    make build            - Executa o fluxo completo (build-front -> copy-front -> build-back)"
	@echo ""
	@echo "  \033[1;33mExecução Local em Produção:\033[0m"
	@echo "    make run-local        - Constrói e executa o servidor localmente na porta $(PORT)"
	@echo "    make start            - Inicia o backend já construído"
	@echo ""
	@echo "  \033[1;36mDocker & Google Cloud Run:\033[0m"
	@echo "    make docker-build     - Cria a imagem Docker local com argumentos de build"
	@echo "    make docker-run       - Executa o container Docker localmente na porta $(PORT)"
	@echo "    make deploy-gcp       - Realiza o deploy direto no Google Cloud Run via gcloud"
	@echo ""
	@echo "  \033[1;31mLimpeza:\033[0m"
	@echo "    make clean            - Remove pastas de build (dist, public, node_modules)"
	@echo ""

# ------------------------------------------------------------------------------
# INSTALAÇÃO DE DEPENDÊNCIAS
# ------------------------------------------------------------------------------
install: install-front install-back
	@echo "✅ Todas as dependências do Frontend e Backend foram instaladas com sucesso!"

install-front:
	@echo "📦 Instalando dependências do Frontend..."
	cd frontend && npm install

install-back:
	@echo "📦 Instalando dependências do Backend..."
	cd backend && npm install

# ------------------------------------------------------------------------------
# DESENVOLVIMENTO LOCAL
# ------------------------------------------------------------------------------
dev-front:
	@echo "🚀 Iniciando Frontend Vite (Mobile Preview)..."
	cd frontend && npm run dev

preview-front:
	@echo "📱 Iniciando Frontend Preview (Produção com PWA)..."
	cd frontend && npm run build && npm run preview

dev-back:
	@echo "🚀 Iniciando Backend Express..."
	cd backend && npm run dev

dev:
	@echo "💡 Dica: Em terminais separados, execute:"
	@echo "   Terminal 1: make dev-front"
	@echo "   Terminal 2: make dev-back"

# ------------------------------------------------------------------------------
# PIPELINE DE BUILD E SINCRONIZAÇÃO
# ------------------------------------------------------------------------------
build-front:
	@echo "🔨 Compilando Frontend com Vite e TypeScript..."
	cd frontend && npm run build

copy-front:
	@echo "📂 Copiando build do frontend (frontend/dist) para o backend (backend/public)..."
	mkdir -p backend/public
	rm -rf backend/public/*
	cp -R frontend/dist/* backend/public/
	@echo "✅ Frontend copiado para backend/public com sucesso!"

build-back:
	@echo "🔨 Compilando Backend TypeScript..."
	cd backend && npm run build

# Pipeline completo: Build Front -> Copia para Backend -> Build Back
build: build-front copy-front build-back
	@echo "🎉 Build de Frontend e Backend concluído com sucesso!"

# ------------------------------------------------------------------------------
# EXECUÇÃO LOCAL (PRODUÇÃO)
# ------------------------------------------------------------------------------
run-local: build
	@echo "🚀 Executando Louvor App localmente na porta $(PORT)..."
	cd backend && PORT=$(PORT) NODE_ENV=production npm start

start:
	@echo "🚀 Iniciando servidor backend..."
	cd backend && PORT=$(PORT) NODE_ENV=production npm start

# ------------------------------------------------------------------------------
# DOCKER & GOOGLE CLOUD RUN
# ------------------------------------------------------------------------------
docker-build:
	@echo "🐳 Construindo imagem Docker para Cloud Run..."
	docker build \
		--build-arg VITE_FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT_ID) \
		--build-arg VITE_FIREBASE_API_KEY=$(FIREBASE_API_KEY) \
		--build-arg VITE_FIREBASE_DATABASE_ID=$(FIREBASE_DATABASE_ID) \
		-t $(IMAGE_TAG) .

docker-run:
	@echo "🐳 Executando container Docker na porta $(PORT)..."
	docker run -it --rm -p $(PORT):8080 -e PORT=8080 -e PROJECT_ID=$(GCP_PROJECT) $(IMAGE_TAG)

deploy-rules:
	@echo "🔒 Publicando regras de segurança do Firestore (firestore.rules)..."
	npx -y firebase-tools deploy --only firestore:rules --project $(GCP_PROJECT)

deploy-gcp:
	@echo "☁️ Iniciando Deploy no Google Cloud Run..."
	@echo "   Projeto GCP:       $(GCP_PROJECT)"
	@echo "   Região:           $(GCP_REGION)"
	@echo "   Serviço:          $(SERVICE_NAME)"
	@echo "   Database ID:      $(FIREBASE_DATABASE_ID)"
	@echo "   Service Account:  $(SERVICE_ACCOUNT)"
	@echo "   Firebase API Key: $(if $(FIREBASE_API_KEY),Configurada,NÃO CONFIGURADA (o app usará modo local/mock))"
	@echo "📦 Preparando variáveis de ambiente para o build do frontend..."
	@echo "VITE_FIREBASE_API_KEY=$(FIREBASE_API_KEY)" > frontend/.env.production
	@echo "VITE_FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT_ID)" >> frontend/.env.production
	@echo "VITE_FIREBASE_DATABASE_ID=$(FIREBASE_DATABASE_ID)" >> frontend/.env.production
	gcloud run deploy $(SERVICE_NAME) \
		--source . \
		--project $(GCP_PROJECT) \
		--region $(GCP_REGION) \
		--platform managed \
		--allow-unauthenticated \
		--service-account $(SERVICE_ACCOUNT) \
		--set-build-env-vars="VITE_FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT_ID),VITE_FIREBASE_API_KEY=$(FIREBASE_API_KEY),VITE_FIREBASE_DATABASE_ID=$(FIREBASE_DATABASE_ID)" \
		--set-env-vars="PROJECT_ID=$(GCP_PROJECT),NODE_ENV=production"

# ------------------------------------------------------------------------------
# LIMPEZA
# ------------------------------------------------------------------------------
clean:
	@echo "🧹 Limpando arquivos compilados..."
	rm -rf frontend/dist
	rm -rf backend/dist
	rm -rf backend/public
	@echo "✅ Limpeza concluída!"
