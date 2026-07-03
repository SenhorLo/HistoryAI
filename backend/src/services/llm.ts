import { streamClaude } from "./claude.js";
import { streamGemini } from "./gemini.js";

// Mensagem em formato neutro, independente do provedor de IA
export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  // Força a saída em JSON válido (modo nativo no Gemini; instrução no Claude)
  json?: boolean;
}

// Gera a resposta em pedaços de texto (deltas), abstraindo o provedor.
// Troque de IA pelo LLM_PROVIDER no .env: "gemini" (grátis) ou "claude".
export function streamLLM(
  history: LLMMessage[],
  options: LLMOptions = {},
): AsyncGenerator<string> {
  const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
  if (provider === "claude") return streamClaude(history, options);
  return streamGemini(history, options);
}

// Resposta completa (não-streaming) — usada na geração de documentos
export async function completeLLM(
  history: LLMMessage[],
  options: LLMOptions = {},
): Promise<string> {
  let text = "";
  for await (const delta of streamLLM(history, options)) text += delta;
  return text;
}
