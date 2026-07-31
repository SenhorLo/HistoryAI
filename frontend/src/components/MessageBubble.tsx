import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { LoaderCircle, Scroll } from "lucide-react";
import AttachmentChip from "./chat/AttachmentChip";
import type { AttachmentMeta } from "../lib/api";

interface Props {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  attachments?: AttachmentMeta[];
}

// memo: durante o streaming só a última mensagem muda — sem isso, cada chunk
// re-parseia o Markdown de toda a conversa
function MessageBubble({ role, content, streaming, attachments }: Props) {
  if (role === "user") {
    return (
      <article aria-label="Sua mensagem" className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[70%] flex flex-col items-end gap-1.5">
          {attachments && attachments.length > 0 && (
            <ul className="flex flex-wrap justify-end gap-1.5">
              {attachments.map((item) => (
                <li key={item.id}>
                  {/* sem onRemove: depois de enviado o anexo faz parte da
                      conversa e só sai junto com ela */}
                  <AttachmentChip
                    name={item.name}
                    size={item.size}
                    kind={item.kind}
                    className="bg-surface-raised"
                  />
                </li>
              ))}
            </ul>
          )}
          {content && (
            <div className="rounded-2xl rounded-br-sm bg-accent-wash border border-accent-line px-4 py-3 whitespace-pre-wrap">
              {content}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article aria-label="Resposta do HistoryAI" className="flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full bg-surface-raised border border-subtle flex items-center justify-center">
        <Scroll size={17} className="text-accent" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        {content && (
          <div className="markdown">
            <ReactMarkdown
              components={{
                a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
        {streaming && (
          <p className="inline-flex items-center gap-2 text-accent text-sm mt-1">
            <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
            {content
              ? "Escrevendo..."
              : "O HistoryAI está consultando os arquivos da história..."}
          </p>
        )}
      </div>
    </article>
  );
}

export default memo(MessageBubble);
