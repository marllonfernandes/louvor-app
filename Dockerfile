# ==========================================
# Etapa 1: Build do Frontend (Vite + React)
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Argumentos opcionais para variáveis injetadas via --build-arg no Cloud Build / CI/CD
ARG VITE_FIREBASE_API_KEY=""
ARG VITE_FIREBASE_PROJECT_ID=""
ARG VITE_FIREBASE_DATABASE_ID=""

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Injeta variáveis no .env.production.local (maior prioridade no Vite) se foram passadas via ARG
RUN if [ -n "$VITE_FIREBASE_API_KEY" ]; then \
      echo "VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY" > .env.production.local && \
      echo "VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID" >> .env.production.local && \
      echo "VITE_FIREBASE_DATABASE_ID=$VITE_FIREBASE_DATABASE_ID" >> .env.production.local; \
    fi

# Debug: mostra os arquivos de ambiente que o Vite vai usar
RUN echo "=== CONTEUDO DO .env.production ===" && cat .env.production || echo "ARQUIVO NAO EXISTE"
RUN echo "=== CONTEUDO DO .env.production.local ===" && cat .env.production.local || echo "ARQUIVO NAO EXISTE"

RUN npm run build

# ==========================================
# Etapa 2: Build do Backend (TypeScript)
# ==========================================
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# ==========================================
# Etapa 3: Imagem Final de Produção (Hardened Cloud Run)
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Instala apenas dependências de produção do backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copia build do backend com permissões de usuário node
COPY --from=backend-builder --chown=node:node /app/backend/dist ./dist

# Copia build do frontend para a pasta pública servida pelo backend
COPY --from=frontend-builder --chown=node:node /app/frontend/dist ./public

# Executa com usuário não-privilegiado (Princípio do Menor Privilégio)
USER node

# Porta padrão do Cloud Run
EXPOSE 8080

# Inicia o servidor Node.js
CMD ["node", "dist/server.js"]
