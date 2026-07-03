import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, Menu, Scroll, Square, SendHorizontal } from "lucide-react";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  streamChat,
  type ConversationSummary,
} from "../lib/api";
import { clearSession, getEmail } from "../lib/auth";

interface LocalMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // espelho síncrono de activeId para os callbacks de fetch/stream saberem
  // se o usuário já trocou de conversa
  const activeIdRef = useRef<string | null>(null);
  const cacheRef = useRef(new Map<string, LocalMessage[]>());
  const pendingDeltaRef = useRef("");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    refreshConversations();
  }, []);

  useEffect(() => {
    // scroll instantâneo durante o streaming — "smooth" a cada chunk empilha
    // animações de rolagem concorrentes
    bottomRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth" });
  }, [messages, streaming]);

  async function refreshConversations() {
    try {
      setConversations(await listConversations());
    } catch {
      /* erros de 401 já redirecionam no client */
    }
  }

  async function selectConversation(id: string) {
    if (streaming) stopStreaming();
    setSidebarOpen(false);
    setError(null);
    activeIdRef.current = id;
    setActiveId(id);

    // conversa já visitada abre na hora, direto do cache
    const cached = cacheRef.current.get(id);
    if (cached) {
      setLoadingConversation(false);
      setMessages(cached);
      return;
    }

    setMessages([]);
    setLoadingConversation(true);
    try {
      const detail = await getConversation(id);
      if (activeIdRef.current !== id) return;
      const msgs = detail.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      cacheRef.current.set(id, msgs);
      setMessages(msgs);
    } catch (err) {
      if (activeIdRef.current !== id) return;
      setError(err instanceof Error ? err.message : "Erro ao carregar conversa.");
    } finally {
      if (activeIdRef.current === id) setLoadingConversation(false);
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  function newConversation() {
    activeIdRef.current = null;
    setActiveId(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  }

  async function removeConversation(id: string) {
    if (!confirm("Apagar esta conversa?")) return;
    try {
      await deleteConversation(id);
      cacheRef.current.delete(id);
      if (id === activeId) newConversation();
      refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao apagar conversa.");
    }
  }

  function appendToLast(chunk: string) {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, content: last.content + chunk };
      return next;
    });
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;

    setError(null);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setStreaming(true);
    pendingDeltaRef.current = "";
    setMessages((prev) => [
      ...prev,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let conversationId = activeId;
      if (!conversationId) {
        const created = await createConversation();
        conversationId = created.id;
        activeIdRef.current = conversationId;
        setActiveId(conversationId);
      }
      const convId = conversationId;

      const flushDelta = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        const chunk = pendingDeltaRef.current;
        pendingDeltaRef.current = "";
        if (chunk && activeIdRef.current === convId) appendToLast(chunk);
      };

      await streamChat(conversationId, message, {
        // deltas do SSE são acumulados e aplicados no máximo uma vez por
        // frame — um setState por chunk re-renderiza a conversa inteira
        // dezenas de vezes por segundo
        onDelta: (delta) => {
          pendingDeltaRef.current += delta;
          if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = null;
              const chunk = pendingDeltaRef.current;
              pendingDeltaRef.current = "";
              if (chunk && activeIdRef.current === convId) appendToLast(chunk);
            });
          }
        },
        onDone: () => {
          flushDelta();
          setStreaming(false);
          setMessages((prev) => {
            if (activeIdRef.current === convId) cacheRef.current.set(convId, prev);
            return prev;
          });
          refreshConversations();
        },
        onError: (msg) => {
          flushDelta();
          setStreaming(false);
          setError(msg);
          setMessages((prev) =>
            prev[prev.length - 1]?.content === ""
              ? prev.slice(0, -1)
              : prev,
          );
        },
      }, controller.signal);
    } catch (err) {
      setStreaming(false);
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function logout() {
    clearSession();
    navigate("/login");
  }

  const empty = messages.length === 0;

  return (
    <div className="h-screen flex bg-[#efe8da] text-stone-800 dark:bg-stone-950 dark:text-stone-100 overflow-hidden">
      <div className="lava-bg">
        <div className="lava-blob lava-1" />
        <div className="lava-blob lava-2" />
        <div className="lava-blob lava-3" />
        <div className="lava-blob lava-4" />
      </div>

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        email={getEmail() ?? ""}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={removeConversation}
        onLogout={logout}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* topo (mobile) */}
        <header className="md:hidden flex items-center gap-3 p-3 border-b border-stone-400/20 bg-white/70 dark:border-stone-700/30 dark:bg-stone-900/70">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-stone-600 dark:text-stone-300 px-2"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <span className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-100">
            <Scroll size={18} className="text-amber-600 dark:text-amber-500" /> HistoryAI
          </span>
        </header>

        {/* mensagens */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {loadingConversation ? (
              <p className="pt-16 flex items-center justify-center gap-2 text-stone-500">
                <LoaderCircle size={18} className="animate-spin" />
                Abrindo conversa...
              </p>
            ) : empty ? (
              <div className="pt-16 text-center">
                <Scroll
                  size={56}
                  className="mx-auto mb-4 text-amber-600"
                  strokeWidth={1.5}
                />
                <h1 className="text-2xl font-bold text-amber-800 dark:text-amber-100 mb-2">
                  E se a história tivesse sido diferente?
                </h1>
                <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                  Proponha um cenário hipotético ou pergunte qualquer coisa
                  sobre história, filosofia, sociologia ou teologia.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  role={m.role}
                  content={m.content}
                  streaming={streaming && i === messages.length - 1}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* erro */}
        {error && (
          <div className="max-w-3xl mx-auto w-full px-4">
            <p className="mb-2 text-sm text-red-600 bg-red-100 border border-red-300 dark:text-red-400 dark:bg-red-950/40 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          </div>
        )}

        {/* input */}
        <div className="border-t border-stone-400/20 bg-white/60 dark:border-stone-700/30 dark:bg-stone-950/70 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="max-w-3xl mx-auto flex gap-2"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Pergunte ao HistoryAI... (Shift+Enter para nova linha)"
              className="flex-1 resize-none rounded-xl bg-white/60 border border-stone-400/30 text-stone-800 placeholder-stone-400 dark:bg-stone-900/70 dark:border-stone-700/50 dark:text-stone-100 dark:placeholder-stone-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-600/60 max-h-40"
            />
            {streaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="flex items-center gap-2 rounded-xl bg-stone-200 hover:bg-stone-300 border border-stone-300 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-700 dark:text-stone-200 font-semibold px-5 transition-colors"
                title="Interromper a resposta"
              >
                <Square size={16} fill="currentColor" /> Parar
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold px-5 transition-colors"
              >
                <SendHorizontal size={16} /> Enviar
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
