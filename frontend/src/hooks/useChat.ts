import { useCallback, useEffect, useRef, useState } from "react";
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  streamChat,
  type ConversationSummary,
} from "../lib/api";

export interface LocalMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Todo o estado da tela de chat: lista de conversas, cache de mensagens já
 * abertas, streaming SSE e cancelamento. A ChatPage só compõe a UI.
 */
export function useChat() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  // espelho síncrono de activeId: os callbacks de fetch/stream precisam saber
  // se o usuário já trocou de conversa antes do próximo render
  const activeIdRef = useRef<string | null>(null);
  const cacheRef = useRef(new Map<string, LocalMessage[]>());
  const pendingDeltaRef = useRef("");
  const rafRef = useRef<number | null>(null);

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(await listConversations());
    } catch {
      /* 401 já redireciona no client; falha aqui só deixa a lista defasada */
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // corta stream e rAF pendentes se a tela desmontar no meio da resposta
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const appendToLast = useCallback((chunk: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, content: last.content + chunk };
      return next;
    });
  }, []);

  /** Remove a bolha vazia do assistente quando a resposta nunca começou. */
  const dropEmptyAssistant = useCallback(() => {
    setMessages((prev) =>
      prev[prev.length - 1]?.role === "assistant" &&
      prev[prev.length - 1]?.content === ""
        ? prev.slice(0, -1)
        : prev,
    );
  }, []);

  const newConversation = useCallback(() => {
    activeIdRef.current = null;
    setActiveId(null);
    setMessages([]);
    setError(null);
  }, []);

  const selectConversation = useCallback(
    async (id: string) => {
      stop();
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
        setError(
          err instanceof Error ? err.message : "Erro ao carregar conversa.",
        );
      } finally {
        if (activeIdRef.current === id) setLoadingConversation(false);
      }
    },
    [stop],
  );

  const removeConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);
        cacheRef.current.delete(id);
        if (id === activeIdRef.current) newConversation();
        refreshConversations();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao apagar conversa.",
        );
      }
    },
    [newConversation, refreshConversations],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || streaming) return;

      setError(null);
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
        let conversationId = activeIdRef.current;
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

        await streamChat(
          convId,
          message,
          {
            // deltas do SSE são acumulados e aplicados no máximo uma vez por
            // frame — um setState por chunk re-renderizaria a conversa inteira
            // dezenas de vezes por segundo
            onDelta: (delta) => {
              pendingDeltaRef.current += delta;
              if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(() => {
                  rafRef.current = null;
                  const chunk = pendingDeltaRef.current;
                  pendingDeltaRef.current = "";
                  if (chunk && activeIdRef.current === convId)
                    appendToLast(chunk);
                });
              }
            },
            onDone: () => {
              flushDelta();
              setStreaming(false);
              setMessages((prev) => {
                if (activeIdRef.current === convId)
                  cacheRef.current.set(convId, prev);
                return prev;
              });
              refreshConversations();
            },
            onError: (msg) => {
              flushDelta();
              setStreaming(false);
              setError(msg);
              dropEmptyAssistant();
            },
          },
          controller.signal,
        );
      } catch (err) {
        // falha antes do stream começar (ex.: createConversation) — sem isso
        // a bolha vazia do assistente ficava na tela para sempre
        setError(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
        dropEmptyAssistant();
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, appendToLast, dropEmptyAssistant, refreshConversations],
  );

  return {
    conversations,
    activeId,
    messages,
    streaming,
    loadingConversation,
    error,
    send,
    stop,
    selectConversation,
    newConversation,
    removeConversation,
  };
}
