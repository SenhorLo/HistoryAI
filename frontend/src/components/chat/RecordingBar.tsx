import { Check, LoaderCircle, X } from "lucide-react";
import { MAX_RECORDING_SECONDS } from "../../hooks/useAudioRecorder";

function formatTime(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

interface Props {
  seconds: number;
  transcribing: boolean;
  onCancel: () => void;
  onFinish: () => void;
}

/**
 * Substitui a linha de controles do composer enquanto o ditado acontece.
 *
 * O contador é aria-hidden e o estado vai num `role="status"` separado: um
 * live region com os segundos anunciaria "1, 2, 3..." sem parar, que é o
 * mesmo motivo de o streaming da resposta não ir em aria-live.
 */
export default function RecordingBar({
  seconds,
  transcribing,
  onCancel,
  onFinish,
}: Props) {
  const remaining = MAX_RECORDING_SECONDS - seconds;
  // avisa quando falta pouco, para o corte automático não pegar de surpresa
  const endingSoon = !transcribing && remaining <= 15;

  return (
    <div className="flex items-center justify-between gap-2 px-2 pb-2">
      <span className="sr-only" role="status">
        {transcribing ? "Transcrevendo o áudio." : "Gravando."}
      </span>

      <span className="ui-text flex items-center gap-2.5 px-2 min-w-0">
        {transcribing ? (
          <>
            <LoaderCircle
              size={15}
              className="text-accent animate-spin shrink-0"
              aria-hidden="true"
            />
            <span className="text-sm text-ink-muted truncate">
              Transcrevendo...
            </span>
          </>
        ) : (
          <>
            {/* pulsa a partir de opaco: se os quadros não rodarem, o ponto
                fica visível parado em vez de sumir */}
            <span
              className="w-2.5 h-2.5 rounded-full bg-accent-solid shrink-0 motion-safe:animate-pulse"
              aria-hidden="true"
            />
            <span
              className="text-sm text-ink-muted tabular-nums"
              aria-hidden="true"
            >
              {formatTime(seconds)}
            </span>
            {endingSoon && (
              <span className="text-xs text-ink-muted truncate">
                {remaining}s restantes
              </span>
            )}
          </>
        )}
      </span>

      <span className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="ui-text inline-flex items-center gap-1.5 rounded-xl min-h-11 px-3 text-sm font-semibold text-ink-muted hover:bg-surface-hover hover:text-ink transition-colors duration-200"
        >
          <X size={15} aria-hidden="true" />
          Descartar
        </button>

        {!transcribing && (
          <button
            type="button"
            onClick={onFinish}
            className="ui-text inline-flex items-center gap-1.5 rounded-xl min-h-11 px-4 text-sm font-semibold bg-accent-solid text-on-accent hover:bg-accent-solid-hover transition-colors duration-200"
          >
            <Check size={15} aria-hidden="true" />
            Concluir
          </button>
        )}
      </span>
    </div>
  );
}
