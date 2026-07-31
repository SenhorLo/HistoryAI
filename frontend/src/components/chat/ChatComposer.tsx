import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, Paperclip, SendHorizontal, Square } from "lucide-react";
import ModeSelector from "./ModeSelector";
import RecordingBar from "./RecordingBar";
import AttachmentChip from "./AttachmentChip";
import { Alert } from "../ui/Alert";
import { IconButton } from "../ui/Button";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { MAX_ATTACHMENTS, useAttachments } from "../../hooks/useAttachments";
import { cn } from "../../lib/cn";
import type { AnswerMode, AttachmentMeta } from "../../lib/api";

/*
  Espelha a lista aceita pelo servidor. É só uma dica para o seletor de
  arquivos do sistema — quem valida de verdade é o backend, porque o
  navegador não impede arrastar um arquivo de outro tipo para a janela.
*/
const ACCEPT =
  "image/png,image/jpeg,image/webp,image/heic,image/heif," +
  "application/pdf," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "text/csv,text/plain,text/markdown,application/json";

const MAX_HEIGHT = 160;

interface Props {
  streaming: boolean;
  onSend: (text: string, attachments: AttachmentMeta[]) => void;
  onStop: () => void;
  mode: AnswerMode;
  onModeChange: (mode: AnswerMode) => void;
  /**
   * Texto injetado de fora (sugestão clicada, ou a pergunta devolvida pelo
   * "Parar"). É um objeto novo a cada vez para o efeito voltar a disparar.
   */
  draft?: { text: string; attachments?: AttachmentMeta[] };
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

  /*
    O ditado NÃO envia sozinho: o texto entra no campo para o usuário revisar.
    Transcrição erra nome próprio e data, que é exatamente o que mais importa
    num chat de história — mandar direto viraria pergunta errada.
  */
  const appendTranscript = useCallback((text: string) => {
    setInput((current) => {
      const trimmed = current.trimEnd();
      return trimmed ? `${trimmed} ${text}` : text;
    });
    textareaRef.current?.focus();
  }, []);

  const recorder = useAudioRecorder(appendTranscript);
  const { cancel: cancelRecording } = recorder;
  const recording =
    recorder.state === "recording" || recorder.state === "transcribing";

  const attachments = useAttachments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggingOver, setDraggingOver] = useState(false);

  // Altura derivada do valor, num layout effect: cobre digitação, sugestão
  // injetada e limpeza pós-envio com um caminho só. Fazer isso via
  // requestAnimationFrame não funcionaria — rAF não dispara em aba oculta.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [input]);

  // sugestão clicada preenche o campo e devolve o foco para o usuário editar.
  // O "Parar" traz junto os anexos, que o servidor manteve válidos.
  const { restore: restoreAttachments } = attachments;
  useEffect(() => {
    if (!draft) return;
    setInput(draft.text);
    if (draft.attachments) restoreAttachments(draft.attachments);
    textareaRef.current?.focus();
  }, [draft, restoreAttachments]);

  // Escape descarta a gravação — mesmo gesto que fecha a gaveta e o diálogo
  useEffect(() => {
    if (!recording) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelRecording();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // depende só de `cancel` (estável, vem de useCallback): usar o objeto
    // `recorder` inteiro reassinaria o listener a cada render do composer
  }, [recording, cancelRecording]);

  function submit() {
    // enviar no meio do ditado perderia o áudio que ainda está sendo gravado,
    // e no meio de um upload perderia o anexo que ainda não tem id
    if (!input.trim() || streaming || recording || attachments.uploading) return;
    // vai a lista inteira, não só os ids: o hook precisa dos metadados para
    // desenhar os chips na bolha antes de a resposta chegar
    onSend(input, attachments.items);
    setInput("");
    attachments.clear();
  }

  return (
    <div className="px-4 pb-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onDragOver={(e) => {
          // só reage a arquivo: arrastar texto selecionado não vira anexo
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDraggingOver(true);
        }}
        onDragLeave={(e) => {
          // ignora a saída para um filho, senão a moldura pisca ao atravessar
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDraggingOver(false);
        }}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDraggingOver(false);
          void attachments.add(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          // o card inteiro é o campo: a borda reage ao foco do textarea, que
          // por isso perde o anel próprio (o :focus-visible global viria aqui)
          "max-w-3xl mx-auto rounded-card border bg-surface-raised",
          "transition-colors duration-200",
          draggingOver
            ? "border-accent-line bg-accent-wash"
            : focused
              ? "border-accent-line"
              : "border-subtle hover:border-strong",
        )}
      >
        {(attachments.items.length > 0 || attachments.pending.length > 0) && (
          <ul className="flex flex-wrap gap-1.5 px-3 pt-3">
            {attachments.items.map((item) => (
              <li key={item.id}>
                <AttachmentChip
                  name={item.name}
                  size={item.size}
                  kind={item.kind}
                  truncated={item.truncated}
                  onRemove={() => attachments.remove(item.id)}
                />
              </li>
            ))}
            {attachments.pending.map((item) => (
              <li key={item.tempId}>
                <AttachmentChip name={item.name} size={item.size} uploading />
              </li>
            ))}
          </ul>
        )}

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

        {recording ? (
          <RecordingBar
            seconds={recorder.seconds}
            transcribing={recorder.state === "transcribing"}
            onCancel={recorder.cancel}
            onFinish={recorder.finish}
          />
        ) : (
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <ModeSelector
              mode={mode}
              onChange={onModeChange}
              disabled={streaming}
            />

            <div className="flex items-center gap-1">
              {!streaming && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPT}
                    className="sr-only"
                    // o input fica fora da tela mas continua focável e ligado
                    // ao rótulo do botão, que é quem o dispara
                    tabIndex={-1}
                    onChange={(e) => {
                      void attachments.add(Array.from(e.target.files ?? []));
                      // zera para o mesmo arquivo poder ser escolhido de novo
                      e.target.value = "";
                    }}
                  />
                  <IconButton
                    label={
                      attachments.full
                        ? `Limite de ${MAX_ATTACHMENTS} arquivos atingido`
                        : "Anexar arquivo"
                    }
                    disabled={attachments.full}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={18} aria-hidden="true" />
                  </IconButton>
                </>
              )}

              {/* o botão só existe onde dá para gravar: mostrá-lo desabilitado
                  num navegador sem suporte só ocuparia a ordem de tabulação */}
              {recorder.supported && !streaming && (
                <IconButton
                  label="Ditar mensagem"
                  onClick={recorder.start}
                  disabled={recorder.state === "requesting"}
                >
                  {recorder.state === "requesting" ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Mic size={18} aria-hidden="true" />
                  )}
                </IconButton>
              )}

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
          </div>
        )}
      </form>

      {(recorder.error || attachments.error) && (
        <Alert className="max-w-3xl mx-auto mt-2">
          {recorder.error ?? attachments.error}
        </Alert>
      )}

      <p className="ui-text mt-2.5 text-center text-xs text-ink-subtle">
        O HistoryAI separa fato documentado de especulação — mas confira o que
        for usar em trabalho acadêmico.
      </p>
    </div>
  );
}
