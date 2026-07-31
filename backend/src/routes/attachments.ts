import { Router } from "express";
import multer from "multer";
import { prisma } from "../services/db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { mediaLimiter } from "../middleware/rateLimit.js";
import {
  ACCEPTED_EXTENSIONS,
  AttachmentError,
  extractAttachment,
  isAcceptedAttachment,
  MAX_ATTACHMENT_BYTES,
} from "../services/attachments.js";

export const attachmentsRouter = Router();

attachmentsRouter.use(requireAuth);

/*
  memoryStorage: os bytes são lidos, extraídos e descartados na mesma
  requisição. Nada vai para o disco — o que evita tanto a limpeza de temporários
  quanto o problema do disco efêmero do Render.
*/
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isAcceptedAttachment(file.mimetype)) {
      cb(new Error("FORMATO_NAO_ACEITO"));
      return;
    }
    cb(null, true);
  },
});

/*
  Anexos que nunca chegaram a virar mensagem são lixo de um envio abandonado
  (o usuário anexou e fechou a aba). Recolher os antigos deste usuário a cada
  upload evita depender de um agendador, que o plano free não tem.
*/
const ORPHAN_MAX_AGE_MS = 6 * 60 * 60 * 1000;

async function sweepOrphans(userId: string) {
  try {
    await prisma.attachment.deleteMany({
      where: {
        userId,
        messageId: null,
        createdAt: { lt: new Date(Date.now() - ORPHAN_MAX_AGE_MS) },
      },
    });
  } catch (err) {
    // limpeza é oportunista: falhar aqui não pode derrubar o upload
    console.error("Falha ao recolher anexos órfãos:", err);
  }
}

/** Nome de arquivo seguro para exibir de volta ao usuário. */
function safeName(raw: string): string {
  // o nome vem do cliente; cortamos caminho e tamanho antes de guardar
  const base = raw.split(/[\\/]/).pop() ?? "arquivo";
  return base.slice(0, 120) || "arquivo";
}

// POST /api/attachments — recebe um arquivo, extrai o conteúdo e guarda o texto.
// Devolve só os metadados: o texto extraído fica no servidor e é injetado no
// histórico na hora do envio, para o cliente não poder forjá-lo.
attachmentsRouter.post("/", mediaLimiter, (req: AuthRequest, res) => {
  upload.single("file")(req, res, async (uploadErr: unknown) => {
    if (uploadErr) {
      if (
        uploadErr instanceof multer.MulterError &&
        uploadErr.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(413).json({
          error: `O arquivo passa de ${Math.floor(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB.`,
        });
      }
      if (
        uploadErr instanceof Error &&
        uploadErr.message === "FORMATO_NAO_ACEITO"
      ) {
        return res.status(415).json({
          error: `Formato não suportado. Aceito: ${ACCEPTED_EXTENSIONS}.`,
        });
      }
      console.error("Erro ao receber o anexo:", uploadErr);
      return res.status(400).json({ error: "Não consegui ler o arquivo." });
    }

    const file = req.file;
    if (!file || file.size === 0) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado." });
    }

    const userId = req.userId!;
    const name = safeName(file.originalname);

    try {
      const extracted = await extractAttachment(
        file.buffer,
        file.mimetype,
        name,
      );

      // a IA responde ILEGIVEL quando não consegue ler a imagem ou o PDF
      if (/^ILEGIVEL\b/i.test(extracted.text)) {
        return res.status(422).json({
          error: `Não consegui ler "${name}". Tente uma imagem mais nítida.`,
        });
      }

      const saved = await prisma.attachment.create({
        data: {
          userId,
          name,
          mimeType: file.mimetype,
          size: file.size,
          kind: extracted.kind,
          extractedText: extracted.text,
        },
        select: { id: true, name: true, kind: true, size: true },
      });

      void sweepOrphans(userId);

      res.status(201).json({ ...saved, truncated: extracted.truncated });
    } catch (err) {
      if (err instanceof AttachmentError) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("Erro ao processar anexo:", err);
      const message = err instanceof Error ? err.message : "";
      if (message.includes("_API_KEY")) {
        return res.status(500).json({ error: message });
      }
      if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({
          error:
            "Limite de uso gratuito da IA atingido no momento. Aguarde um minuto e tente novamente.",
        });
      }
      res
        .status(502)
        .json({ error: "Não consegui processar o arquivo agora. Tente de novo." });
    }
  });
});

// DELETE /api/attachments/:id — remove um anexo ainda não enviado.
// Só apaga o que ainda está solto: depois de virar mensagem, ele faz parte
// da conversa e some junto com ela.
attachmentsRouter.delete("/:id", async (req: AuthRequest, res) => {
  const { count } = await prisma.attachment.deleteMany({
    where: { id: String(req.params.id), userId: req.userId, messageId: null },
  });
  if (count === 0) return res.status(404).json({ error: "Anexo não encontrado." });
  res.status(204).end();
});
