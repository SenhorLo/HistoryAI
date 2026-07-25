import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SendHorizontal, Square } from "lucide-react";
import { Button } from "../ui/Button";

const MAX_HEIGHT = 160;

interface Props {
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /**
   * Texto injetado de fora (ex.: sugestão da tela vazia). É um objeto novo a
   * cada escolha para que reescolher a mesma sugestão volte a disparar.
   */
  draft?: { text: string };
}

export default function ChatComposer({
  streaming,
  onSend,
  onStop,
  draft,
}: Props) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Altura derivada do valor, num layout effect: cobre digitação, sugestão
  // injetada e limpeza pós-envio com um caminho só. Fazer isso via
  // requestAnimationFrame não funcionaria — rAF não dispara em aba oculta.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [input]);

  // sugestão clicada preenche o campo e devolve o foco para o usuário editar
  useEffect(() => {
    if (!draft) return;
    setInput(draft.text);
    textareaRef.current?.focus();
  }, [draft]);

  function submit() {
    if (!input.trim() || streaming) return;
    onSend(input);
    setInput("");
  }

  return (
    <div className="border-t border-subtle bg-surface-sunken p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="max-w-3xl mx-auto flex gap-2 items-end"
      >
        <label htmlFor="chat-input" className="sr-only">
          Sua pergunta para o HistoryAI
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          aria-describedby="chat-input-hint"
          placeholder="Pergunte ao HistoryAI..."
          className="flex-1 resize-none rounded-xl px-4 py-3 max-h-40 bg-surface-raised text-ink placeholder-ink-subtle border border-subtle hover:border-strong transition-colors duration-200"
        />
        <p id="chat-input-hint" className="sr-only">
          Pressione Enter para enviar, Shift mais Enter para quebrar linha.
        </p>

        {streaming ? (
          <Button type="button" variant="secondary" onClick={onStop}>
            <Square size={16} fill="currentColor" aria-hidden="true" />
            Parar
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()}>
            <SendHorizontal size={16} aria-hidden="true" />
            Enviar
          </Button>
        )}
      </form>
    </div>
  );
}
