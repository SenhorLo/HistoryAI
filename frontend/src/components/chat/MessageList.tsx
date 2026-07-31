import { useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import MessageBubble from "../MessageBubble";
import EmptyState from "./EmptyState";
import type { LocalMessage } from "../../hooks/useChat";

interface Props {
  messages: LocalMessage[];
  streaming: boolean;
  loading: boolean;
  /** nome já resolvido: apelido escolhido, ou prefixo do e-mail */
  greetingName: string;
  onPickExample: (text: string) => void;
}

export default function MessageList({
  messages,
  streaming,
  loading,
  greetingName,
  onPickExample,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scroll instantâneo durante o streaming — "smooth" a cada chunk empilha
    // animações de rolagem concorrentes
    bottomRef.current?.scrollIntoView({
      behavior: streaming ? "auto" : "smooth",
    });
  }, [messages, streaming]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Estado do stream anunciado por leitor de tela. O texto em si NÃO vai
          num aria-live: caractere a caractere viraria spam ininterrupto. */}
      <p className="sr-only" role="status" aria-live="polite">
        {loading
          ? "Carregando conversa."
          : streaming
            ? "O HistoryAI está respondendo."
            : messages.length > 0
              ? "Resposta concluída."
              : ""}
      </p>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <p className="pt-16 flex items-center justify-center gap-2 text-ink-muted">
            <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
            Abrindo conversa...
          </p>
        ) : messages.length === 0 ? (
          <EmptyState name={greetingName} onPickExample={onPickExample} />
        ) : (
          <div role="log" aria-label="Histórico da conversa" className="space-y-6">
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                attachments={m.attachments}
                streaming={streaming && i === messages.length - 1}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
