import Anthropic from "@anthropic-ai/sdk";
import { systemPrompt } from "../prompts/historyai.js";
import type { LLMMessage, LLMOptions } from "./llm.js";

// Cliente criado sob demanda para o servidor subir mesmo sem a chave configurada
let client: Anthropic | null = null;
function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith("COLOQUE")) {
      throw new Error(
        "ANTHROPIC_API_KEY não configurada. Crie sua chave em https://platform.claude.com e coloque no backend/.env",
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Por modo: teto de saída e nível de esforço. "effort" controla profundidade de
// raciocínio e gasto total de tokens; o padrão da API é "high".
const MODE_CONFIG = {
  fast: { maxTokens: 8000, effort: "low" },
  optimised: { maxTokens: 64000, effort: "high" },
} as const;

export async function* streamClaude(
  history: LLMMessage[],
  options: LLMOptions = {}, // JSON garantido via prompt no Claude
): AsyncGenerator<string> {
  const mode = options.mode ?? "fast";
  const { maxTokens, effort } = MODE_CONFIG[mode];

  const stream = getClient().messages.stream({
    model: "claude-opus-4-8",
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    output_config: { effort },
    // cache_control no prompt de sistema: cada modo tem seu próprio prefixo
    // estável, então os dois se beneficiam do cache independentemente
    system: [
      {
        type: "text",
        text: systemPrompt(mode),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}
