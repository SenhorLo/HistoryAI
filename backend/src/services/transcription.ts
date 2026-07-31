import { generateFromMedia } from "./gemini.js";

/*
  Transcrição de áudio ditado no chat.

  O resultado NÃO é a resposta da IA: é o texto que vai para o campo de
  digitação, para o usuário revisar e enviar. Por isso o prompt é o mais
  literal possível — qualquer "melhoria" aqui seria o sistema colocando
  palavras na boca do usuário.
*/

/*
  Formatos que a API do Gemini aceita para áudio. webm NÃO está na lista,
  e é justamente o que o MediaRecorder do Chrome produz — por isso o cliente
  converte para WAV antes de enviar. Se algum dia webm passar a ser aceito,
  a conversão no navegador pode sair.
*/
export const ACCEPTED_AUDIO_MIME = [
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp3",
  "audio/aiff",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
] as const;

export function isAcceptedAudio(mimeType: string): boolean {
  // alguns navegadores mandam "audio/wav;codecs=1"
  const base = mimeType.split(";")[0].trim().toLowerCase();
  return (ACCEPTED_AUDIO_MIME as readonly string[]).includes(base);
}

/** Devolvido pelo modelo quando não há fala inteligível na gravação. */
const NO_SPEECH = "[[SEM_FALA]]";

const PROMPT = `Transcreva o áudio acima literalmente, palavra por palavra.

Regras:
- Responda APENAS com a transcrição. Nada de introdução, comentário, aspas ou formatação.
- Mantenha o idioma original de quem fala. Não traduza.
- Não resuma, não corrija o raciocínio e não complete frases interrompidas.
- Use pontuação e maiúsculas normais para o texto ficar legível.
- Ignore ruído de fundo, música e silêncio.
- Se não houver nenhuma fala inteligível, responda exatamente ${NO_SPEECH} e mais nada.`;

export class NoSpeechError extends Error {
  constructor() {
    super("Não consegui identificar fala nesta gravação.");
    this.name = "NoSpeechError";
  }
}

/**
 * Transcreve o áudio e devolve o texto limpo.
 * @throws {NoSpeechError} quando a gravação não tem fala inteligível.
 */
export async function transcribeAudio(
  data: Buffer,
  mimeType: string,
): Promise<string> {
  const raw = await generateFromMedia({
    prompt: PROMPT,
    data,
    mimeType: mimeType.split(";")[0].trim().toLowerCase(),
    // 8k tokens cobre com folga o teto de duração aceito pelo cliente
    maxOutputTokens: 8192,
  });

  const text = cleanUp(raw);
  if (!text || text.includes(NO_SPEECH)) throw new NoSpeechError();
  return text;
}

/*
  Mesmo instruído a devolver só a transcrição, o modelo às vezes embrulha o
  texto numa cerca de código ou em aspas. Tirar isso aqui é mais barato do
  que o usuário ter que apagar na mão a cada ditado.
*/
function cleanUp(raw: string): string {
  let text = raw.trim();

  const fence = text.match(/^```[a-z]*\n([\s\S]*?)\n?```$/i);
  if (fence) text = fence[1].trim();

  if (text.length > 1) {
    const first = text[0];
    const last = text[text.length - 1];
    const pairs: Record<string, string> = { '"': '"', "'": "'", "“": "”" };
    if (pairs[first] === last) text = text.slice(1, -1).trim();
  }

  return text;
}
