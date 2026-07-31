import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SendHorizontal, Square } from "lucide-react";
import ModeSelector from "./ModeSelector";
import { cn } from "../../lib/cn";
import type { AnswerMode } from "../../lib/api";

const MAX_HEIGHT = 160;

interface Props {
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  mode: AnswerMode;
  onModeChange: (mode: AnswerMode) => void;
  /**
   * Texto injetado de fora (sugestão clicada, ou a pergunta devolvida pelo
   * "Parar"). É um objeto novo a cada vez para o efeito voltar a disparar.
   */
  draft?: { text: string };
}

export default function ChatComposer({
  streaming,
  onSend,
  onStop,
  mode,
  onModeChange,
  draft,
}: Props) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
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
    <div className="px-4 pb-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          // o card inteiro é o campo: a borda reage ao foco do textarea, que
          // por isso perde o anel próprio (o :focus-visible global viria aqui)
          "max-w-3xl mx-auto rounded-card border bg-surface-raised",
          "transition-colors duration-200",
          focused ? "border-accent-line" : "border-subtle hover:border-strong",
        )}
      >
        <label htmlFor="chat-input" className="sr-only">
          Sua pergunta para o HistoryAI
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          aria-describedby="chat-input-hint"
          placeholder="Pergunte ao HistoryAI..."
          className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 max-h-40 text-ink placeholder-ink-subtle focus:outline-none"
        />
        <p id="chat-input-hint" className="sr-only">
          Pressione Enter para enviar, Shift mais Enter para quebrar linha.
        </p>

        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <ModeSelector mode={mode} onChange={onModeChange} disabled={streaming} />

          {streaming ? (
            <button
              type="button"
              onClick={onStop}
              className="ui-text inline-flex items-center gap-2 rounded-xl min-h-11 px-4 font-semibold border border-accent-line bg-accent-wash text-accent hover:bg-accent-wash-hover transition-colors duration-200"
            >
              <Square size={15} fill="currentColor" aria-hidden="true" />
              Parar
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Enviar mensagem"
              className="inline-flex items-center justify-center rounded-xl min-h-11 min-w-11 bg-accent-solid text-on-accent hover:bg-accent-solid-hover disabled:opacity-40 disabled:pointer-events-none transition-colors duration-200"
            >
              <SendHorizontal size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      <p className="ui-text mt-2.5 text-center text-xs text-ink-subtle">
        O HistoryAI separa fato documentado de especulação — mas confira o que
        for usar em trabalho acadêmico.
      </p>
    </div>
  );
}
