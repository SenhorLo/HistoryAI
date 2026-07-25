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
