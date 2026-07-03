import Anthropic from "@anthropic-ai/sdk";
import { HISTORYAI_SYSTEM_PROMPT } from "../prompts/historyai.js";
import type { LLMMessage } from "./llm.js";

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

export async function* streamClaude(
  history: LLMMessage[],
  _options: import("./llm.js").LLMOptions = {}, // JSON garantido via prompt no Claude
): AsyncGenerator<string> {
  const stream = getClient().messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: HISTORYAI_SYSTEM_PROMPT,
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
