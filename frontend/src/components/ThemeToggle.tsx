import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getTheme, type Theme } from "../lib/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(getTheme());

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className={`flex items-center justify-center rounded-lg border border-stone-400/30 bg-stone-500/15 text-stone-600 hover:bg-stone-500/25 dark:border-stone-700 dark:bg-stone-700/40 dark:text-stone-300 dark:hover:bg-stone-600/50 transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
