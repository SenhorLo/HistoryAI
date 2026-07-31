import { GoogleGenAI } from "@google/genai";
import { systemPrompt } from "../prompts/historyai.js";
import type { LLMMessage, LLMOptions } from "./llm.js";

// Cliente criado sob demanda para o servidor subir mesmo sem a chave configurada
let client: GoogleGenAI | null = null;
function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith("COLOQUE")) {
      throw new Error(
        "GEMINI_API_KEY não configurada. Crie sua chave gratuita em https://aistudio.google.com/apikey e coloque no backend/.env",
      );
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// Teto de saída por modo. No modo rápido é a segunda barreira contra respostas
// longas (a primeira é o prompt) e segura a cota gratuita do Gemini.
const MAX_OUTPUT_TOKENS = { fast: 4096, optimised: 32768 } as const;

export async function* streamGemini(
  history: LLMMessage[],
  options: LLMOptions = {},
): AsyncGenerator<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const mode = options.mode ?? "fast";

  const stream = await getClient().models.generateContentStream({
    model,
    contents: history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: systemPrompt(mode),
      maxOutputTokens: MAX_OUTPUT_TOKENS[mode],
      // Modo JSON nativo: garante saída estruturada válida
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

/*
  Chamada de uso único com um arquivo anexado (áudio, imagem, PDF).

  Sempre no Gemini, independente do LLM_PROVIDER. Não é descuido: o Claude
  não aceita áudio, e a chave da Anthropic está vazia neste projeto. Trocar
  o provedor do chat não pode desligar a transcrição.

  Não usa o systemPrompt do HistoryAI de propósito. Aquele prompt manda a IA
  escrever história contrafactual; aplicá-lo aqui faria a transcrição virar
  um ensaio sobre o áudio em vez do que foi dito.
*/
export async function generateFromMedia(params: {
  prompt: string;
  data: Buffer;
  mimeType: string;
  maxOutputTokens?: number;
}): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  const response = await getClient().models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: params.mimeType,
              data: params.data.toString("base64"),
            },
          },
          { text: params.prompt },
        ],
      },
    ],
    config: {
      maxOutputTokens: params.maxOutputTokens ?? 8192,
      // transcrever e extrair texto são tarefas de cópia, não de raciocínio.
      // O 2.5 Flash pensa por padrão e cobra por isso — aqui só encareceria.
      thinkingConfig: { thinkingBudget: 0 },
      // saída determinística: a mesma gravação deve dar a mesma transcrição
      temperature: 0,
    },
  });

  return response.text ?? "";
}
