import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/cn";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  /** Texto de apoio permanente, abaixo do campo. */
  hint?: string;
  /** Erro específico deste campo — some assim que o usuário corrige. */
  error?: string;
}

/**
 * Campo com label visível e associado (nunca placeholder como label),
 * mensagem de erro junto do campo e ligação por aria-describedby.
 */
export function Field({
  label,
  hint,
  error,
  className,
  type,
  ...rest
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  // Campo de senha ganha botão de exibir/ocultar: digitar uma senha às cegas
  // é a maior causa de erro de digitação no cadastro.
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="block mb-1.5 text-sm font-semibold text-ink-muted"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full min-h-11 rounded-lg px-3.5 py-2.5",
            "bg-surface-sunken text-ink placeholder-ink-subtle",
            "border transition-colors duration-200",
            isPassword && "pr-12",
            error ? "border-danger" : "border-subtle hover:border-strong",
            className,
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={revealed}
            className="absolute right-0 top-0 h-full w-12 inline-flex items-center justify-center rounded-r-lg text-ink-subtle hover:text-ink transition-colors duration-200"
          >
            {revealed ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
