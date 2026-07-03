# 📜 HistoryAI

Chatbot especializado em história contrafactual ("E se...?") — com conhecimento em história, filosofia, sociologia e teologia. Gera PDFs e apresentações de slides sob demanda: basta pedir no chat ("gere um PDF sobre...", "faça slides sobre...").

## Stack

- **Frontend:** React + TypeScript + TailwindCSS (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Banco:** PostgreSQL local (Prisma ORM)
- **IA:** dois provedores intercambiáveis via `LLM_PROVIDER` no `backend/.env`:
  - `gemini` (padrão) — Google Gemini, chave **gratuita** em https://aistudio.google.com/apikey;
  - `claude` — Claude Opus 4.8 (`@anthropic-ai/sdk`), chave em https://platform.claude.com.

## Configuração (uma vez)

1. **Edite `backend/.env`:**
   - `DATABASE_URL` — ajuste a senha do seu usuário `postgres`;
   - `GEMINI_API_KEY` — chave gratuita do Google AI Studio (ou `ANTHROPIC_API_KEY` + `LLM_PROVIDER="claude"`).

2. **Crie o banco e as tabelas:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

## Login com Google (opcional)

1. Acesse https://console.cloud.google.com/apis/credentials, crie um projeto e um
   **ID do cliente OAuth** do tipo "Aplicativo da Web".
2. Em "Origens JavaScript autorizadas", adicione `http://localhost:5173`.
3. Copie o Client ID (termina em `.apps.googleusercontent.com`) e cole:
   - em `backend/.env` → `GOOGLE_CLIENT_ID`;
   - em `frontend/.env` → `VITE_GOOGLE_CLIENT_ID`.
4. Reinicie os dois servidores. O botão "Continuar com o Google" aparece na tela
   de login/registro. Se o e-mail ainda não tiver conta, o cadastro é automático.

## Rodando (dois terminais)

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Abra http://localhost:5173 — a landing page apresenta o projeto; "Testar agora"
leva ao cadastro e o chat fica em `/chat`.

## Estrutura

```
backend/
  src/index.ts              servidor Express
  src/routes/               auth, conversations, chat (SSE)
  src/services/llm.ts       abstração do provedor de IA (gemini | claude)
  src/services/documents.ts geração de PDF (pdfkit) e slides (pptxgenjs)
  src/services/gemini.ts    integração com o Google Gemini
  src/services/claude.ts    integração com a Claude API
  src/prompts/historyai.ts  system prompt do HistoryAI
  prisma/schema.prisma      User, Conversation, Message
frontend/
  src/pages/                LandingPage, AuthPage (login/registro), ChatPage
  src/components/           Sidebar, MessageBubble
  src/lib/                  api.ts (fetch + SSE), auth.ts (sessão)
```

Plano completo do projeto: veja `PLANO.md`.
