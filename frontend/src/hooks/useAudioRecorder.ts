import { useCallback, useEffect, useRef, useState } from "react";
import { canRecordAudio, pickRecorderMimeType, toWav } from "../lib/audio";
import { transcribeAudio } from "../lib/api";

export type RecorderState = "idle" | "requesting" | "recording" | "transcribing";

/*
  Teto de 3 minutos. Não é arbitrário: a conversão dá WAV de ~32 KB/s, então
  3 minutos são ~5,8 MB, com folga sobre o limite de 10 MB da rota. Também
  protege a cota — 1 minuto de áudio custa 1.920 tokens de entrada.
*/
export const MAX_RECORDING_SECONDS = 180;

/** Mensagens por tipo de recusa do navegador ao pedir o microfone. */
function permissionMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Você precisa permitir o acesso ao microfone para ditar.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Nenhum microfone foi encontrado neste dispositivo.";
  }
  if (name === "NotReadableError") {
    return "O microfone está sendo usado por outro programa.";
  }
  return "Não consegui acessar o microfone.";
}

/**
 * Gravação por voz do composer. O texto transcrito volta pelo `onText` e vai
 * para o campo de digitação — quem decide enviar continua sendo o usuário.
 */
export function useAudioRecorder(onText: (text: string) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // "descartar" precisa ser lido dentro do onstop, que roda depois do clique
  const cancelledRef = useRef(false);
  // o callback muda de identidade a cada render do composer; guardar em ref
  // evita reassinar o recorder e evita fechar sobre uma versão velha
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Solta o microfone. Sem isso o indicador de gravação do navegador fica aceso. */
  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  // se a tela desmontar no meio da gravação, o microfone tem que ser solto
  useEffect(
    () => () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [stopTimer],
  );

  const finish = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    stopTimer();
    recorder.stop();
  }, [stopTimer]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    finish();
    setState("idle");
    setSeconds(0);
  }, [finish]);

  const start = useCallback(async () => {
    if (state !== "idle") return;
    setError(null);

    if (!canRecordAudio()) {
      setError("Este navegador não permite gravar áudio. Tente pelo Chrome.");
      return;
    }

    setState("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // o navegador já entrega voz mais limpa com isto ligado, e sai
        // mais barato que qualquer tratamento nosso depois
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      setError(permissionMessage(err));
      setState("idle");
      return;
    }

    cancelledRef.current = false;
    chunksRef.current = [];
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream, {
      mimeType: pickRecorderMimeType(),
    });
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      const parts = chunksRef.current;
      chunksRef.current = [];
      const wasCancelled = cancelledRef.current;
      releaseMic();
      stopTimer();

      if (wasCancelled || parts.length === 0) {
        setState("idle");
        setSeconds(0);
        return;
      }

      setState("transcribing");
      try {
        const wav = await toWav(new Blob(parts, { type: recorder.mimeType }));
        const text = await transcribeAudio(wav);
        // o usuário pode ter clicado em cancelar enquanto transcrevia
        if (!cancelledRef.current) onTextRef.current(text);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não consegui transcrever o áudio.",
        );
      } finally {
        setState("idle");
        setSeconds(0);
      }
    };

    recorder.start();
    setState("recording");
    setSeconds(0);

    /*
      setInterval, não requestAnimationFrame: o rAF não dispara em aba oculta,
      e o contador precisa continuar correndo (junto com o corte automático)
      mesmo se a pessoa trocar de aba no meio do ditado.
    */
    timerRef.current = setInterval(() => {
      setSeconds((value) => {
        const next = value + 1;
        if (next >= MAX_RECORDING_SECONDS) finish();
        return next;
      });
    }, 1000);
  }, [state, finish, releaseMic, stopTimer]);

  return {
    state,
    seconds,
    error,
    dismissError: useCallback(() => setError(null), []),
    supported: canRecordAudio(),
    start,
    finish,
    cancel,
  };
}
