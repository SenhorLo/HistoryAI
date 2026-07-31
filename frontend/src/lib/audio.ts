/*
  Conversão da gravação para WAV antes de enviar ao servidor.

  Por que isso existe: o MediaRecorder produz webm/opus no Chrome e no
  Firefox, e mp4/aac no Safari. A API do Gemini aceita wav, mp3, aiff, aac,
  ogg e flac — webm NÃO está na lista. Como o navegador já sabe decodificar
  o que ele mesmo gravou, reencodar aqui resolve sem nenhuma dependência e
  sem transcodificar no servidor (que no plano free tem 512 MB de RAM).

  O custo é tamanho: WAV é PCM sem compressão. Por isso reamostramos para
  16 kHz mono, que é o suficiente para voz e é a taxa que os modelos de fala
  usam internamente. Dá ~32 KB por segundo — um minuto ocupa ~1,9 MB.
*/

const TARGET_SAMPLE_RATE = 16000;
const BYTES_PER_SAMPLE = 2; // PCM 16 bits

/* Safari só expôs os nomes sem prefixo a partir da versão 14.1. */
type AudioContextCtor = typeof AudioContext;
type OfflineAudioContextCtor = typeof OfflineAudioContext;

function audioContextCtor(): AudioContextCtor | undefined {
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext;
}

function offlineContextCtor(): OfflineAudioContextCtor | undefined {
  const w = window as unknown as {
    OfflineAudioContext?: OfflineAudioContextCtor;
    webkitOfflineAudioContext?: OfflineAudioContextCtor;
  };
  return w.OfflineAudioContext ?? w.webkitOfflineAudioContext;
}

/** Formatos de gravação, do preferido para o alternativo. */
const RECORDER_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

/** Melhor formato que este navegador grava, ou undefined se nenhum serve. */
export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return RECORDER_MIME_TYPES.find((type) =>
    MediaRecorder.isTypeSupported(type),
  );
}

/** Se este navegador tem todas as peças para gravar e converter. */
export function canRecordAudio(): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!audioContextCtor() &&
    !!offlineContextCtor() &&
    !!pickRecorderMimeType()
  );
}

/**
 * Decodifica o que o MediaRecorder gravou e devolve um WAV 16 kHz mono.
 * Roda inteiro no navegador — o áudio original nunca chega ao servidor.
 */
export async function toWav(recorded: Blob): Promise<Blob> {
  const Ctx = audioContextCtor();
  const Offline = offlineContextCtor();
  if (!Ctx || !Offline) {
    throw new Error("Este navegador não consegue processar o áudio gravado.");
  }

  const bytes = await recorded.arrayBuffer();
  const context = new Ctx();
  let decoded: AudioBuffer;
  try {
    decoded = await context.decodeAudioData(bytes);
  } finally {
    // sem fechar, cada gravação deixa um contexto de áudio vivo; os
    // navegadores limitam quantos podem existir ao mesmo tempo
    void context.close();
  }

  const frames = Math.max(1, Math.ceil(decoded.duration * TARGET_SAMPLE_RATE));
  // destino com 1 canal: conectar uma fonte estéreo aqui já faz a mistura
  // para mono, então não precisamos somar os canais na mão
  const offline = new Offline(1, frames, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();

  return encodeWav(rendered.getChannelData(0), TARGET_SAMPLE_RATE);
}

/** Quantos segundos de áudio cabem num limite de bytes, nesta taxa. */
export function secondsForBytes(maxBytes: number): number {
  return Math.floor(maxBytes / (TARGET_SAMPLE_RATE * BYTES_PER_SAMPLE));
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const dataBytes = samples.length * BYTES_PER_SAMPLE;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");

  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // tamanho deste bloco
  view.setUint16(20, 1, true); // 1 = PCM sem compressão
  view.setUint16(22, 1, true); // canais
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * BYTES_PER_SAMPLE, true); // bytes por segundo
  view.setUint16(32, BYTES_PER_SAMPLE, true); // alinhamento do bloco
  view.setUint16(34, 8 * BYTES_PER_SAMPLE, true); // bits por amostra

  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    // fora de [-1, 1] o valor daria a volta no inteiro e viraria estalo
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped * (clamped < 0 ? 0x8000 : 0x7fff), true);
    offset += BYTES_PER_SAMPLE;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
