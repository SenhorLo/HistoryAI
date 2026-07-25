import { useEffect, useRef } from "react";
import { LogOut, Plus, Scroll } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ConversationItem from "./ConversationItem";
import { useIsDesktop } from "../hooks/useMediaQuery";
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
          "fixed md:relative z-30 h-full w-72 shrink-0 flex flex-col",
          "bg-surface-raised transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* divisa suave em degradê no lugar de borda dura */}
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-strong to-transparent"
        />

        <div className="p-4 border-b border-subtle flex items-center gap-2">
          <Scroll size={22} className="text-accent" aria-hidden="true" />
          <span className="font-display font-semibold tracking-wider text-accent">
            HISTORYAI
          </span>
        </div>

        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onNew}
            className="w-full min-h-11 flex items-center justify-center gap-1.5 rounded-lg border border-accent-line bg-accent-wash text-accent hover:bg-accent-wash-hover text-sm font-semibold transition-colors duration-200"
          >
            <Plus size={16} aria-hidden="true" /> Nova conversa
          </button>
        </div>

        <nav aria-label="Histórico de conversas" className="flex-1 overflow-y-auto px-3 py-3">
          {conversations.length === 0 ? (
            <p className="text-ink-subtle text-sm px-2 py-4 text-center">
              Suas conversas aparecerão aqui.
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
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
          )}
        </nav>

        <div className="p-3 border-t border-subtle">
          <p className="text-ink-subtle text-sm truncate mb-2" title={email}>
            {email}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 min-h-11 flex items-center justify-center gap-1.5 rounded-lg bg-surface-active text-ink-muted hover:text-ink hover:bg-surface-hover text-sm transition-colors duration-200"
            >
              <LogOut size={15} aria-hidden="true" /> Sair
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
