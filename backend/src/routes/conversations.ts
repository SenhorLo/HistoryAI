import { Router } from "express";
import { prisma } from "../services/db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);

// Lista as conversas do usuário (para a sidebar)
conversationsRouter.get("/", async (req: AuthRequest, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
  res.json(conversations);
});

// Cria uma conversa nova
conversationsRouter.post("/", async (req: AuthRequest, res) => {
  const conversation = await prisma.conversation.create({
    data: { title: "Nova conversa", userId: req.userId! },
  });
  res.status(201).json(conversation);
});

// Carrega uma conversa com todas as mensagens (retomar)
conversationsRouter.get("/:id", async (req: AuthRequest, res) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });
  if (!conversation) {
    return res.status(404).json({ error: "Conversa não encontrada." });
  }
  res.json(conversation);
});

// Apaga uma conversa
conversationsRouter.delete("/:id", async (req: AuthRequest, res) => {
  const result = await prisma.conversation.deleteMany({
    where: { id: String(req.params.id), userId: req.userId },
  });
  if (result.count === 0) {
    return res.status(404).json({ error: "Conversa não encontrada." });
  }
  res.status(204).end();
});
