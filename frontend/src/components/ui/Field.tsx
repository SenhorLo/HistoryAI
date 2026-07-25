import { useId, type InputHTMLAttributes } from "react";
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
export function Field({ label, hint, error, className, ...rest }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="block mb-1.5 text-sm font-semibold text-ink-muted"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full min-h-11 rounded-lg px-3.5 py-2.5",
          "bg-surface-sunken text-ink placeholder-ink-subtle",
          "border transition-colors duration-200",
          error ? "border-danger" : "border-subtle hover:border-strong",
          className,
        )}
        {...rest}
      />
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
