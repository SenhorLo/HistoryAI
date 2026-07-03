import { Router } from "express";
import { z } from "zod";
import { prisma } from "../services/db.js";
import { streamLLM, type LLMMessage } from "../services/llm.js";
import { generateDocument, type DocKind } from "../services/documents.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

const bodySchema = z.object({
  message: z.string().trim().min(1, "A mensagem não pode ser vazia.").max(8000),
});

function sse(res: import("express").Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Converte erros técnicos dos provedores de IA em mensagens claras para o usuário
function friendlyLLMError(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err);
  if (text.includes("_API_KEY")) return text;
  if (text.includes("429") || text.includes("RESOURCE_EXHAUSTED") || text.includes("rate")) {
    return "Limite de uso gratuito da IA atingido no momento. Aguarde um minuto e tente novamente.";
  }
  if (text.includes("503") || text.includes("UNAVAILABLE") || text.includes("overloaded")) {
    return "O serviço de IA está sobrecarregado. Tente novamente em instantes.";
  }
  if (text.includes("401") || text.includes("403") || text.includes("API key")) {
    return "Chave de API inválida. Verifique a configuração no backend/.env.";
  }
  return "Ocorreu um erro ao gerar a resposta. Tente novamente.";
}

// POST /api/conversations/:id/chat — envia mensagem e transmite a resposta via SSE
chatRouter.post("/:id/chat", async (req: AuthRequest, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { message } = parsed.data;
  const conversationId = String(req.params.id);

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: req.userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) {
    return res.status(404).json({ error: "Conversa não encontrada." });
  }

  // Salva a mensagem do usuário e, se for a primeira, usa-a como título
  await prisma.message.create({
    data: { role: "user", content: message, conversationId: conversation.id },
  });
  if (conversation.messages.length === 0) {
    const title = message.length > 60 ? `${message.slice(0, 57)}...` : message;
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { title },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
  }

  // Histórico completo — as APIs de LLM são stateless, então reenviamos tudo
  const history: LLMMessage[] = [
    ...conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // O marcador [[DOC:pdf]] / [[DOC:pptx]] é um comando interno da IA e não deve
  // aparecer para o usuário: seguramos os últimos caracteres do stream (holdback)
  // até ter certeza de que não são o início de um marcador.
  const MARKER_RE = /\[\[DOC:(pdf|pptx)\]\]/g;
  const HOLDBACK = 12; // tamanho de "[[DOC:pptx]]"
  let fullText = "";
  let tail = "";
  let docKind: DocKind | null = null;

  const emit = (text: string) => {
    if (!text) return;
    fullText += text;
    sse(res, "delta", { text });
  };
  const drainTail = (final: boolean) => {
    tail = tail.replace(MARKER_RE, (_m, kind: string) => {
      docKind = kind as DocKind;
      return "";
    });
    if (final) {
      emit(tail.replace(/\s+$/, ""));
      tail = "";
    } else if (tail.length > HOLDBACK) {
      emit(tail.slice(0, tail.length - HOLDBACK));
      tail = tail.slice(tail.length - HOLDBACK);
    }
  };

  try {
    for await (const delta of streamLLM(history)) {
      tail += delta;
      drainTail(false);
    }
    drainTail(true);

    // Pedido de documento detectado — gera o arquivo e anexa o link à resposta
    if (docKind) {
      try {
        const { url, title } = await generateDocument(docKind, history);
        const label = docKind === "pdf" ? "Baixar PDF" : "Baixar slides (PPTX)";
        emit(`\n\n---\n\n**Documento pronto:** [${title} — ${label}](${url})`);
      } catch (docErr) {
        console.error("Erro ao gerar documento:", docErr);
        emit("\n\n_Não consegui gerar o documento agora. Tente pedir novamente._");
      }
    }

    if (fullText.trim().length > 0) {
      await prisma.message.create({
        data: {
          role: "assistant",
          content: fullText,
          conversationId: conversation.id,
        },
      });
    }

    sse(res, "done", {});
  } catch (err) {
    console.error("Erro no streaming da IA:", err);
    sse(res, "error", { error: friendlyLLMError(err) });
  } finally {
    res.end();
  }
});
