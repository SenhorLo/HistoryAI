import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../services/db.js";
import { authLimiter } from "../middleware/rateLimit.js";

export const authRouter = Router();

// Limite por IP em todo o roteador de auth (register + login) — anti força bruta
authRouter.use(authLimiter);

const credentialsSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Este e-mail já está cadastrado." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  res.status(201).json({ token: signToken(user.id), email: user.email });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

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

  res.json({ token: signToken(user.id), email: user.email });
});
