# 🎵 Louvor App - Ministério de Música (Mobile Native & Google Cloud Run)

Aplicativo moderno de alta performance para **Gestão do Ministério de Louvor**, com experiência 100% **Mobile Nativa (PWA)**, backend **Node.js** para hospedagem estática com SPA fallback, persistência integrada ao **Cloud Firestore** (`app-unida`) e automação completa via **Makefile** para deploy no **Google Cloud Run**.

---

## 📱 Destaques da Experiência Mobile Nativa

- **Navegação Inferior Nativa (Bottom Nav Bar)**: Abas rápidas para Agenda, Repertório e Equipe com safe area e feedback tátil.
- **Gavetas Inferiores Deslizantes (Bottom Sheets)**: No lugar de popups desktop tradicionais, modais abrem suavemente de baixo para cima com puxador superior (handle) e animação fluida.
- **Integração Instantânea com WhatsApp**:
  - Confirmação individual de presença para integrantes da escala em 1 clique (`wa.me`).
  - Compartilhamento formatado da escala completa (com horários, integrantes e setlist) para o grupo do louvor.
- **Repertório Interativo**:
  - Player embutido do YouTube responsivo.
  - Ferramenta de **Transposição de Tom (+/- semitons)** para vocalistas e instrumentistas.
  - Filtros instantâneos por Tom, Momento do Culto (Adoração, Celebração, etc.) e BPM.
- **Gestão de Escalas e Equipes**:
  - Controle de presença em tempo real (Confirmado ✅, Recusado ❌, Pendente ⏳).
  - Times fixos (ex: Time Alfa, Jovens) e escalas avulsas.
- **Sincronização Cloud Firestore + Fallback Offline**:
  - Conexão configurada para o banco Firestore do projeto `app-unida`.
  - Fallback transparente e instantâneo com armazenamento local reativo caso esteja offline.

---

## 🛠️ Comandos do Makefile

Todos os processos do projeto estão centralizados no `Makefile`:

| Comando | Descrição |
|---|---|
| `make install` | Instala todas as dependências do Frontend e Backend |
| `make dev-front` | Executa o frontend em modo Dev com Vite (porta `5173`) |
| `make dev-back` | Executa o backend Express em modo Dev com hot-reload |
| `make build-front` | Compila o frontend React + TypeScript (`frontend/dist`) |
| `make copy-front` | Copia os arquivos compilados do frontend para `backend/public` |
| `make build-back` | Compila o backend TypeScript para JavaScript (`backend/dist`) |
| `make build` | **Executa o pipeline completo**: `build-front` ➔ `copy-front` ➔ `build-back` |
| `make run-local` | Executa o build e roda o servidor em produção localmente na porta `8080` |
| `make docker-build`| Constrói a imagem Docker multi-stage localmente |
| `make docker-run` | Executa o container Docker localmente na porta `8080` |
| `make deploy-gcp` | Realiza o deploy direto no **Google Cloud Run** usando `gcloud` |

---

## 🚀 Como Executar Localmente

### 1. Instalar Dependências
```bash
make install
```

### 2. Desenvolvimento com Hot-Reload
Em um terminal:
```bash
make dev-front
```
Acesse `http://localhost:5173` no navegador ou inspecione com a visualização mobile do DevTools.

### 3. Teste em Produção Local (Servido pelo Backend Node.js)
```bash
make run-local
```
Acesse `http://localhost:8080`.

---

## ☁️ Deploy no Google Cloud Run

O projeto possui um `Dockerfile` multi-stage otimizado que compila tanto o frontend quanto o backend em uma imagem leve Node.js Alpine que escuta na porta dinâmica `$PORT` do Cloud Run.

### Deploy direto via gcloud:
```bash
make deploy-gcp
```
*(Você pode sobrescrever variáveis caso necessário: `make deploy-gcp GCP_PROJECT=app-unida GCP_REGION=us-central1`)*

---

## 📁 Estrutura de Pastas

```
app-louvor/
├── Makefile                      # Automação de processos (build, copy, deploy)
├── Dockerfile                    # Container multi-stage pronto para Cloud Run
├── .dockerignore
├── .env.example
├── README.md
├── frontend/                     # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── public/                   # Manifest PWA e ícones
│   ├── src/
│   │   ├── components/           # Componentes modulares (Agenda, Playlist, Team, UI)
│   │   ├── config/               # Configuração do Firebase/Firestore
│   │   ├── services/             # Camada Firestore com reatividade e mock
│   │   ├── types/                # Definições TypeScript
│   │   └── utils/                # WhatsApp, YouTube, Transpositor de Tom
│   └── vite.config.ts
└── backend/                      # Servidor Node.js / Express
    ├── src/
    │   └── server.ts             # Servidor com SPA Fallback, /api/health e static host
    └── public/                   # Destino dos arquivos de build do frontend
```
