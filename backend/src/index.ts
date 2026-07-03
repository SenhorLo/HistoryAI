import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { conversationsRouter } from "./routes/conversations.js";
import { chatRouter } from "./routes/chat.js";
import { FILES_DIR } from "./services/documents.js";

const app = express();

// Atrás do proxy do Render (e da maioria dos hosts): confia em 1 salto para
// que req.ip reflita o IP real do cliente — necessário para o rate limit por IP
app.set("trust proxy", 1);

// Em produção o frontend é servido pelo próprio Express (mesma origem, CORS
// dispensável). CORS_ORIGIN só é necessário se o front for hospedado em
// domínio separado; sem ela, libera tudo (modo dev).
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(",") } : {}));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "HistoryAI" }));

// Documentos gerados (PDF/PPTX) — nomes de arquivo aleatórios servem de proteção
fs.mkdirSync(FILES_DIR, { recursive: true });
app.use("/api/files", express.static(FILES_DIR));

app.use("/api/auth", authRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/conversations", chatRouter);

// Frontend buildado (frontend/dist) — servido pelo Express quando existir,
// dispensando um host separado para o front
const frontendDist = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../frontend/dist",
);
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback: rotas do React Router (/login, /chat...) devolvem o index.html
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`HistoryAI backend rodando em http://localhost:${port}`);
});
