import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { LoaderCircle, Scroll } from "lucide-react";

interface Props {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

// memo: durante o streaming só a última mensagem muda — sem isso, cada chunk
// re-parseia o Markdown de toda a conversa
function MessageBubble({ role, content, streaming }: Props) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[70%] rounded-2xl rounded-br-sm bg-amber-500/15 border border-amber-600/20 text-stone-800 dark:bg-amber-900/40 dark:border-amber-800/40 dark:text-stone-100 px-4 py-3 whitespace-pre-wrap">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-white/70 border border-stone-400/30 dark:bg-stone-800/70 dark:border-stone-700 flex items-center justify-center">
        <Scroll size={16} className="text-amber-700 dark:text-amber-500" />
      </div>
      <div className="max-w-[85%] md:max-w-[75%] text-stone-800 dark:text-stone-200">
        {content ? (
          <div className="markdown">
            <ReactMarkdown
              components={{
                a: (props) => (
                  <a {...props} target="_blank" rel="noreferrer" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : null}
        {streaming && (
          <span className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-500 text-sm mt-1">
            <LoaderCircle size={15} className="animate-spin" />
            {content
              ? "Escrevendo..."
              : "O HistoryAI está consultando os arquivos da história..."}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(MessageBubble);
