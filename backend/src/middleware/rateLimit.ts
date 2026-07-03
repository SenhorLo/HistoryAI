import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { AuthRequest } from "./auth.js";

// Lê um inteiro do ambiente com valor padrão de segurança
function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// --- Limite POR USUÁRIO no chat (protege a cota/custo da IA) ---
// Deve ser aplicado DEPOIS do requireAuth, para que req.userId exista.
// Padrão: 20 mensagens a cada 5 minutos por usuário. Configurável via env.
const CHAT_WINDOW_MIN = envInt("CHAT_RATE_WINDOW_MIN", 5);
const CHAT_MAX = envInt("CHAT_RATE_MAX", 20);

export const chatLimiter = rateLimit({
  windowMs: CHAT_WINDOW_MIN * 60 * 1000,
  limit: CHAT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  // chave = id do usuário autenticado (não o IP): o limite é por conta,
  // então vários usuários atrás do mesmo IP não se prejudicam
  keyGenerator: (req) => (req as AuthRequest).userId ?? "anon",
  handler: (_req, res) => {
    res.status(429).json({
      error: `Você atingiu o limite de ${CHAT_MAX} mensagens a cada ${CHAT_WINDOW_MIN} minutos. Aguarde um pouco antes de enviar novas mensagens.`,
    });
  },
});

// --- Limite POR IP nos endpoints de autenticação (anti força bruta) ---
// Padrão: 10 tentativas a cada 15 minutos por IP.
const AUTH_WINDOW_MIN = envInt("AUTH_RATE_WINDOW_MIN", 15);
const AUTH_MAX = envInt("AUTH_RATE_MAX", 10);

// IP real do cliente. Em produção o app fica atrás do Cloudflare (Render),
// então "CF-Connecting-IP" traz o IP verdadeiro de forma estável; sem ele,
// cai no req.ip. ipKeyGenerator normaliza IPv6 corretamente.
function clientIpKey(req: { headers: Record<string, unknown>; ip?: string }): string {
  const cf = req.headers["cf-connecting-ip"];
  const ip = (typeof cf === "string" && cf) || req.ip || "unknown";
  return ipKeyGenerator(ip);
}

export const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MIN * 60 * 1000,
  limit: AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => clientIpKey(req as never),
  handler: (_req, res) => {
    res.status(429).json({
      error: `Muitas tentativas. Aguarde ${AUTH_WINDOW_MIN} minutos e tente novamente.`,
    });
  },
});
