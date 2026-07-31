import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, PanelLeft, Scroll } from "lucide-react";
import Sidebar from "../components/Sidebar";
import LavaBackground from "../components/LavaBackground";
import MessageList from "../components/chat/MessageList";
import ChatComposer from "../components/chat/ChatComposer";
import { Alert } from "../components/ui/Alert";
import { IconButton } from "../components/ui/Button";
import DisplayNameDialog from "../components/chat/DisplayNameDialog";
import { useChat } from "../hooks/useChat";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { clearSession, getDisplayName, getEmail } from "../lib/auth";

export default function ChatPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // no desktop a gaveta é fixa e pode ser recolhida para dar espaço à leitura
  const [collapsed, setCollapsed] = useState(false);
  const email = getEmail() ?? "";

  const [displayName, setDisplayName] = useState(getDisplayName);
  // só pergunta uma vez por visita: recusar não pode fazer o diálogo voltar
  // a cada re-render, e o "Agora não" precisa valer para a sessão inteira
  const [askedForName, setAskedForName] = useState(false);
  const needsName = !displayName && !askedForName;

  const greetingName = displayName || email.split("@")[0] || "";

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

  const activeTitle =
    conversations.find((c) => c.id === activeId)?.title ?? "Nova conversa";

  return (
    <div className="h-dvh overflow-hidden bg-surface text-ink">
      <a href="#conteudo" className="skip-link">
        Pular para a conversa
      </a>
      <LavaBackground />

      <div className="app-shell">
        {(!collapsed || !isDesktop) && (
          <Sidebar
            conversations={conversations}
            activeId={activeId}
            open={sidebarOpen}
            email={email}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={removeConversation}
            onLogout={logout}
            onClose={closeSidebar}
          />
        )}

        <main id="conteudo" className="flex-1 flex flex-col min-w-0">
          {/*
            Estes dois botões são alternativos, não responsivos por CSS: a
            classe `hidden` não vence o `inline-flex` da base do IconButton
            (ambos são utilities de display na mesma camada do Tailwind, e a
            ordem no atributo não decide qual ganha). Renderizar condicional
            resolve e ainda tira o botão inútil da ordem de tabulação.
          */}
          <header className="flex items-center gap-2 px-3 py-2.5 border-b border-subtle">
            {isDesktop ? (
              <IconButton
                label={
                  collapsed ? "Mostrar barra lateral" : "Recolher barra lateral"
                }
                aria-pressed={collapsed}
                onClick={() => setCollapsed((v) => !v)}
              >
                <PanelLeft size={18} aria-hidden="true" />
              </IconButton>
            ) : (
              <IconButton
                label="Abrir menu"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} aria-hidden="true" />
              </IconButton>
            )}

            <span className="flex items-center gap-2 min-w-0 rounded-xl border border-subtle bg-surface-sunken px-3 py-1.5">
              <Scroll size={15} className="text-accent shrink-0" aria-hidden="true" />
              <span className="text-sm text-ink-muted truncate max-w-[16rem]">
                {activeTitle}
              </span>
            </span>
          </header>

          <MessageList
            messages={messages}
            streaming={streaming}
            loading={loadingConversation}
            greetingName={greetingName}
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

      {needsName && (
        <DisplayNameDialog
          suggestion={email.split("@")[0] ?? ""}
          onDone={(name) => {
            setAskedForName(true);
            if (name) setDisplayName(name);
          }}
        />
      )}
    </div>
  );
}
