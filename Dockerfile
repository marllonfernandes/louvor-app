# ==========================================
# Etapa 1: Build do Frontend (Vite + React)
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Usaremos o arquivo frontend/.env (copiado localmente) para as variáveis
# Não definimos ENV VITE_FIREBASE_* vazios aqui para não sobrescrever o .env


COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
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
