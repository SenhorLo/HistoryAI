import { getToken, clearSession } from "./auth";

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && token) {
    clearSession();
    window.location.href = "/login";
    throw new Error("Sessão expirada.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Autenticação ---

export function register(email: string, password: string) {
  return request<{ token: string; email: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<{ token: string; email: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// --- Conversas ---

export function listConversations() {
  return request<ConversationSummary[]>("/conversations");
}

export function createConversation() {
  return request<ConversationSummary>("/conversations", { method: "POST" });
}

export function getConversation(id: string) {
  return request<ConversationDetail>(`/conversations/${id}`);
}

export function deleteConversation(id: string) {
  return request<void>(`/conversations/${id}`, { method: "DELETE" });
}

// --- Chat com streaming (SSE sobre fetch) ---

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamChat(
  conversationId: string,
  message: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
) {
  let res: Response;
  try {
    res = await fetch(`/api/conversations/${conversationId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ message }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      handlers.onDone();
      return;
    }
    handlers.onError("Não foi possível conectar ao servidor.");
    return;
  }

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    handlers.onError(body?.error ?? "Não foi possível enviar a mensagem.");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processEvent = (raw: string) => {
    let event = "message";
    let data = "";
    for (const line of raw.split("\n")) {
      if (line.startsWith("event: ")) event = line.slice(7).trim();
      else if (line.startsWith("data: ")) data += line.slice(6);
    }
    if (!data) return;
    try {
      const payload = JSON.parse(data);
      if (event === "delta") handlers.onDelta(payload.text);
      else if (event === "done") handlers.onDone();
      else if (event === "error") handlers.onError(payload.error);
    } catch {
      // ignora eventos malformados
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        processEvent(buffer.slice(0, sep));
        buffer = buffer.slice(sep + 2);
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      handlers.onDone(); // usuário clicou em "Parar" — o que chegou fica na tela
      return;
    }
    handlers.onError("Conexão interrompida durante a resposta.");
  }
}
