import { Router } from "express";
import { z } from "zod";
import { prisma } from "../services/db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { DISPLAY_NAME_MAX, displayNameFailure } from "../lib/validation.js";

/*
  Router separado do de auth de propósito: o authRouter aplica o authLimiter
  (10 requisições por IP a cada 15 min, anti força bruta). Salvar o nome de
  exibição cairia nesse mesmo balde e, num IP compartilhado, gastaria as
  tentativas de login de outra pessoa.
*/
export const profileRouter = Router();

profileRouter.use(requireAuth);

const bodySchema = z.object({
  displayName: z
    .string()
    .max(DISPLAY_NAME_MAX)
    .superRefine((value, ctx) => {
      const failure = displayNameFailure(value);
      if (failure) ctx.addIssue({ code: "custom", message: failure });
    }),
});

profileRouter.patch("/", async (req: AuthRequest, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { displayName: parsed.data.displayName.trim() },
    select: { email: true, displayName: true },
  });

  res.json(user);
});
