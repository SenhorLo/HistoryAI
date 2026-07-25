import { useSyncExternalStore } from "react";

const KEY = "historyai_theme";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

export function getTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  return saved === "light" ? "light" : "dark"; // escuro é o padrão
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  // faz scrollbars e controles nativos acompanharem o tema
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(KEY, theme);
  listeners.forEach((fn) => fn());
}

export function initTheme() {
  const theme = getTheme();
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Tema compartilhado entre todas as instâncias do ThemeToggle — com useState
 * local, dois toggles montados ao mesmo tempo ficariam dessincronizados.
 */
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
  return [theme, () => applyTheme(theme === "dark" ? "light" : "dark")];
}
