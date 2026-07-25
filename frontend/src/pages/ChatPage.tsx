import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Scroll } from "lucide-react";
import Sidebar from "../components/Sidebar";
import LavaBackground from "../components/LavaBackground";
import MessageList from "../components/chat/MessageList";
import ChatComposer from "../components/chat/ChatComposer";
import { Alert } from "../components/ui/Alert";
import { IconButton } from "../components/ui/Button";
import { useChat } from "../hooks/useChat";
import { clearSession, getEmail } from "../lib/auth";

export default function ChatPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    conversations,
    activeId,
    messages,
    streaming,
    loadingConversation,
    error,
    mode,
    setMode,
    draft,
    setDraft,
    send,
    stop,
    selectConversation,
    newConversation,
    removeConversation,
  } = useChat();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const handleSelect = useCallback(
    (id: string) => {
      selectConversation(id);
      setSidebarOpen(false);
    },
    [selectConversation],
  );

  const handleNew = useCallback(() => {
    newConversation();
    setSidebarOpen(false);
  }, [newConversation]);

  function logout() {
    clearSession();
    // volta para a home, não para o login: sair não é o mesmo que querer entrar
    navigate("/");
  }

  return (
    <div className="h-dvh flex bg-surface text-ink overflow-hidden">
      <a href="#conteudo" className="skip-link">
        Pular para a conversa
      </a>
      <LavaBackground />

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        email={getEmail() ?? ""}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={removeConversation}
        onLogout={logout}
        onClose={closeSidebar}
      />

      <main
        id="conteudo"
        className="relative z-10 flex-1 flex flex-col min-w-0"
      >
        {/* topo (mobile) */}
        <header className="md:hidden flex items-center gap-2 p-2 border-b border-subtle bg-surface-raised">
          <IconButton label="Abrir menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} aria-hidden="true" />
          </IconButton>
          <span className="flex items-center gap-2 font-display font-semibold tracking-wider text-accent">
            <Scroll size={18} aria-hidden="true" /> HISTORYAI
          </span>
        </header>

        <MessageList
          messages={messages}
          streaming={streaming}
          loading={loadingConversation}
          onPickExample={(text: string) => setDraft({ text })}
        />

        {error && (
          <div className="max-w-3xl mx-auto w-full px-4 pb-2">
            <Alert>{error}</Alert>
          </div>
        )}

        <ChatComposer
          streaming={streaming}
          onSend={send}
          onStop={stop}
          mode={mode}
          onModeChange={setMode}
          draft={draft}
        />
      </main>
    </div>
  );
}
