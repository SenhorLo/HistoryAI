import { LogOut, Plus, Scroll, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
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
  return (
    <>
      {/* overlay no mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:relative z-30 h-full w-72 shrink-0 bg-white/70 dark:bg-stone-900/70 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* divisa suave em degradê no lugar de borda dura */}
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-stone-400/30 to-transparent dark:via-stone-600/30" />
        <div className="p-4 border-b border-stone-400/20 dark:border-stone-700/30 flex items-center gap-2">
          <Scroll size={24} className="text-amber-700 dark:text-amber-500" />
          <span className="font-bold text-amber-900 dark:text-amber-100 text-lg">
            HistoryAI
          </span>
        </div>

        <button
          onClick={onNew}
          className="mx-3 mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-amber-600/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:border-amber-700/40 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-200 py-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nova conversa
        </button>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {conversations.length === 0 && (
            <p className="text-stone-400 dark:text-stone-500 text-sm px-2 py-4 text-center">
              Suas conversas aparecerão aqui.
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center rounded-lg text-sm ${
                c.id === activeId
                  ? "bg-stone-500/15 text-stone-800 dark:bg-stone-700/40 dark:text-stone-100"
                  : "text-stone-500 hover:bg-stone-500/10 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-700/25 dark:hover:text-stone-200"
              }`}
            >
              <button
                onClick={() => onSelect(c.id)}
                className="flex-1 text-left px-3 py-2 truncate"
                title={c.title}
              >
                {c.title}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 px-2 text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400 transition-opacity"
                title="Apagar conversa"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-stone-400/20 dark:border-stone-700/30 text-sm">
          <p
            className="text-stone-400 dark:text-stone-500 truncate mb-2"
            title={email}
          >
            {email}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-stone-500/15 hover:bg-stone-500/25 text-stone-600 dark:bg-stone-700/40 dark:hover:bg-stone-600/50 dark:text-stone-300 py-1.5 transition-colors"
            >
              <LogOut size={15} /> Sair
            </button>
            <ThemeToggle className="w-9 py-1.5" />
          </div>
        </div>
      </aside>
    </>
  );
}
