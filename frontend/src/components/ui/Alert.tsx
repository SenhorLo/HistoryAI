import { AlertTriangle } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Erro anunciado por leitor de tela assim que aparece.
 * role="alert" já implica aria-live="assertive".
 */
export function Alert({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-sm",
        "bg-danger-wash border border-danger-line text-danger",
        className,
      )}
    >
      <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
