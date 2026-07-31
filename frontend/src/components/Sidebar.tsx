import { useEffect, useMemo, useRef } from "react";
import { LogOut, Plus, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ConversationItem from "./ConversationItem";
import Logo from "./ui/Logo";
import { IconButton } from "./ui/Button";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { groupConversations } from "../lib/groupConversations";
import { cn } from "../lib/cn";
import type { ConversationSummary } from "../lib/api";

interface Props {
  conversations: ConversationSummary[];
  activeId: string | null;
  open: boolean;
  email: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
  onClose: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  open,
  email,
  onSelect,
  onNew,
  onDelete,
  onLogout,
  onClose,
}: Props) {
  const isDesktop = useIsDesktop();
  const asideRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  const groups = useMemo(
    () => groupConversations(conversations),
    [conversations],
  );

  // Fora do desktop a gaveta fechada continua no DOM: sem `inert` o Tab
  // caminha por links invisíveis fora da tela.
  const hidden = !isDesktop && !open;

  useEffect(() => {
    if (isDesktop || !open) return;

    previouslyFocused.current = document.activeElement;
    asideRef.current?.querySelector<HTMLElement>("button, a")?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // devolve o foco a quem abriu a gaveta
      (previouslyFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [open, isDesktop, onClose]);

  return (
    <>
      {open && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={asideRef}
        inert={hidden}
        aria-label="Conversas"
        className={cn(
          "fixed md:relative z-30 h-full w-[17.5rem] shrink-0 flex flex-col",
          "bg-surface-sunken border-r border-subtle",
          "transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <Logo size="sm" boxed className="min-w-0" />
          {/* fechar a gaveta no mobile sem precisar acertar o overlay.
              Condicional, não `md:hidden`: a classe não venceria o
              `inline-flex` da base do IconButton. */}
          {!isDesktop && (
            <IconButton label="Fechar menu" onClick={onClose}>
              <X size={18} aria-hidden="true" />
            </IconButton>
          )}
        </div>

        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={onNew}
            className="ui-text w-full min-h-11 flex items-center justify-center gap-2 rounded-xl bg-accent-solid text-on-accent hover:bg-accent-solid-hover font-semibold transition-colors duration-200"
          >
            <Plus size={17} aria-hidden="true" /> Nova conversa
          </button>
        </div>

        <nav
          aria-label="Histórico de conversas"
          className="flex-1 overflow-y-auto px-3 pb-3"
        >
          {groups.length === 0 ? (
            <p className="ui-text text-ink-subtle text-sm px-2 py-6 text-center">
              Suas conversas aparecerão aqui.
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="mb-4 last:mb-0">
                <h2 className="section-label text-accent px-2 mb-2">
                  {group.label}
                </h2>
                <ul className="space-y-0.5">
                  {group.items.map((c) => (
                    <ConversationItem
                      key={c.id}
                      id={c.id}
                      title={c.title}
                      active={c.id === activeId}
                      onSelect={onSelect}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </nav>

        {/* card do usuário, fixo no rodapé */}
        <div className="p-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-subtle bg-surface-raised p-2.5">
            <span
              aria-hidden="true"
              className="grid place-items-center w-9 h-9 rounded-full bg-accent-wash border border-accent-line text-accent font-system text-sm shrink-0"
            >
              {email.slice(0, 1).toUpperCase() || "?"}
            </span>
            <p className="ui-text flex-1 min-w-0 text-sm text-ink-muted truncate" title={email}>
              {email}
            </p>
            <ThemeToggle className="w-11" />
            <IconButton label="Sair da conta" onClick={onLogout}>
              <LogOut size={17} aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </aside>
    </>
  );
}
