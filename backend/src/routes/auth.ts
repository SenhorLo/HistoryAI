import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../services/db.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  emailFailure,
  normalizeEmail,
  passwordFailures,
} from "../lib/validation.js";

export const authRouter = Router();

// Limite por IP em todo o roteador de auth (register + login) — anti força bruta
authRouter.use(authLimiter);

/*
  Os dois schemas são propositalmente diferentes.

  O cadastro aplica as regras novas (maiúscula, número, especial, mínimo 8).
  O login NÃO aplica: quem criou a conta antes destas regras tem senha fora
  do padrão e precisa continuar entrando. Validar o formato no login também
  vazaria a política de senha para quem está tentando adivinhar — e, pior,
  devolveria 400 antes mesmo de conferir as credenciais.
*/
const registerSchema = z.object({
  email: z.string().superRefine((value, ctx) => {
    const failure = emailFailure(value);
    if (failure) ctx.addIssue({ code: "custom", message: failure });
  }),
  password: z.string().superRefine((value, ctx) => {
    const missing = passwordFailures(value);
    if (missing.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `A senha precisa de: ${missing.join(", ").toLowerCase()}.`,
      });
    }
  }),
});

const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail."),
  password: z.string().min(1, "Informe sua senha."),
});

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const email = normalizeEmail(parsed.data.email);
  const { password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Este e-mail já está cadastrado." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  res.status(201).json({
    token: signToken(user.id),
    email: user.email,
    displayName: user.displayName,
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const email = normalizeEmail(parsed.data.email);
  const { password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // contas antigas criadas via Google não têm senha — o login por senha
  // não se aplica a elas
  if (user && !user.passwordHash) {
    return res.status(401).json({
      error: "Esta conta não possui senha cadastrada. Crie uma nova conta.",
    });
  }
  if (!user || !(await bcrypt.compare(password, user.passwordHash!))) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }

  res.json({
    token: signToken(user.id),
    email: user.email,
    displayName: user.displayName,
  });
});
