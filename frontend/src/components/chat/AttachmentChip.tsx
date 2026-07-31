import {
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  LoaderCircle,
  X,
} from "lucide-react";
import { cn } from "../../lib/cn";
import type { AttachmentKind } from "../../lib/api";

const ICONS: Record<AttachmentKind, typeof FileText> = {
  image: FileImage,
  pdf: FileText,
  doc: FileType,
  sheet: FileSpreadsheet,
  text: FileText,
};

/** Rótulo por tipo, para o nome acessível dizer o que é o arquivo. */
const LABELS: Record<AttachmentKind, string> = {
  image: "imagem",
  pdf: "PDF",
  doc: "documento do Word",
  sheet: "planilha",
  text: "arquivo de texto",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  name: string;
  size: number;
  kind?: AttachmentKind;
  /** Mostra o giro de carregando no lugar do ícone do tipo. */
  uploading?: boolean;
  /** O conteúdo foi cortado no teto de caracteres. */
  truncated?: boolean;
  onRemove?: () => void;
  className?: string;
}

export default function AttachmentChip({
  name,
  size,
  kind = "text",
  uploading,
  truncated,
  onRemove,
  className,
}: Props) {
  const Icon = ICONS[kind];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 max-w-[15rem] min-w-0",
        "rounded-xl border border-subtle bg-surface-sunken pl-2.5 pr-1 py-1",
        className,
      )}
    >
      {uploading ? (
        <LoaderCircle
          size={15}
          className="shrink-0 text-accent animate-spin"
          aria-hidden="true"
        />
      ) : (
        <Icon size={15} className="shrink-0 text-accent" aria-hidden="true" />
      )}

      <span className="ui-text min-w-0 py-1">
        <span className="block text-xs text-ink truncate">{name}</span>
        <span className="block text-[0.68rem] text-ink-muted">
          {uploading
            ? "processando..."
            : truncated
              ? `${formatBytes(size)} - conteúdo cortado`
              : formatBytes(size)}
        </span>
      </span>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          // nome explícito: sem ele o leitor de tela anunciaria só "botão",
          // e com vários chips não daria para saber qual está removendo
          aria-label={`Remover ${LABELS[kind]} ${name}`}
          title="Remover"
          className="shrink-0 grid place-items-center w-11 h-11 -my-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors duration-200"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
