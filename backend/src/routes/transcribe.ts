import { Router } from "express";
import multer from "multer";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { mediaLimiter } from "../middleware/rateLimit.js";
import {
  isAcceptedAudio,
  NoSpeechError,
  transcribeAudio,
} from "../services/transcription.js";

export const transcribeRouter = Router();

transcribeRouter.use(requireAuth);

/*
  Teto de 10 MB. O cliente manda WAV 16 kHz mono, que dá ~32 KB por segundo,
  então isso são uns 5 minutos — folga confortável sobre o limite de 3 minutos
  que o gravador impõe. O limite existe para o caso de alguém chamar a rota
  fora da interface.

  memoryStorage, não disco: o áudio é usado uma vez e descartado. Nada de
  arquivo temporário para limpar depois, e nada sobra no disco efêmero do
  Render caso a requisição falhe no meio.
*/
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isAcceptedAudio(file.mimetype)) {
      cb(new Error("FORMATO_NAO_ACEITO"));
      return;
    }
    cb(null, true);
  },
});

// POST /api/transcribe — recebe a gravação e devolve o texto ditado.
// O texto volta para o campo de digitação; quem envia a mensagem é o usuário.
transcribeRouter.post("/", mediaLimiter, (req: AuthRequest, res) => {
  upload.single("audio")(req, res, async (uploadErr: unknown) => {
    if (uploadErr) {
      if (
        uploadErr instanceof multer.MulterError &&
        uploadErr.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(413).json({
          error: "A gravação ficou grande demais. Grave um trecho mais curto.",
        });
      }
      if (
        uploadErr instanceof Error &&
        uploadErr.message === "FORMATO_NAO_ACEITO"
      ) {
        return res
          .status(415)
          .json({ error: "Formato de áudio não suportado." });
      }
      console.error("Erro ao receber o áudio:", uploadErr);
      return res.status(400).json({ error: "Não consegui ler o áudio enviado." });
    }

    const file = req.file;
    if (!file || file.size === 0) {
      return res.status(400).json({ error: "Nenhuma gravação foi enviada." });
    }

    try {
      const text = await transcribeAudio(file.buffer, file.mimetype);
      res.json({ text });
    } catch (err) {
      if (err instanceof NoSpeechError) {
        // 422: o arquivo chegou certo, só não tinha o que transcrever
        return res.status(422).json({ error: err.message });
      }
      console.error("Erro ao transcrever áudio:", err);
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
        .json({ error: "Não consegui transcrever agora. Tente de novo." });
    }
  });
});
