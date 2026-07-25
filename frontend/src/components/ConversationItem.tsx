import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { cn } from "../lib/cn";

interface Props {
  id: string;
  title: string;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Item da lista de conversas. A confirmação de exclusão é inline: o
 * `confirm()` nativo tira o usuário do contexto e não é estilizável.
 */
export default function ConversationItem({
  id,
  title,
  active,
  onSelect,
  onDelete,
}: Props) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <li>
        <div className="flex items-center gap-1 rounded-lg bg-danger-wash border border-danger-line px-2 py-1">
          <span className="flex-1 text-sm text-danger truncate">Apagar?</span>
          <button
            type="button"
            onClick={() => onDelete(id)}
            aria-label={`Confirmar exclusão da conversa ${title}`}
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-danger hover:bg-danger-line/40 transition-colors duration-200"
          >
            <Check size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            aria-label="Cancelar exclusão"
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-ink-muted hover:bg-surface-hover transition-colors duration-200"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li>
      <div
        className={cn(
          "group flex items-center rounded-lg transition-colors duration-200",
          active
            ? "bg-surface-active text-ink"
            : "text-ink-muted hover:bg-surface-hover hover:text-ink",
        )}
      >
        <button
          type="button"
          onClick={() => onSelect(id)}
          aria-current={active ? "page" : undefined}
          className="flex-1 min-w-0 min-h-11 text-left px-3 py-2 truncate text-sm"
          title={title}
        >
          {title}
        </button>
        {/*
          Visível por padrão no toque e revelado no hover só a partir de `md`:
          `opacity-0 group-hover:opacity-100` puro deixa o botão inalcançável
          em telas sem cursor. `group-focus-within` mantém o teclado atendido.
        */}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Apagar conversa ${title}`}
          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-ink-subtle hover:text-danger transition-all duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:focus-visible:opacity-100"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
