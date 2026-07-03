const KEY = "historyai_theme";

export type Theme = "light" | "dark";

export function getTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  return saved === "light" ? "light" : "dark"; // escuro é o padrão
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(KEY, theme);
}

export function initTheme() {
  document.documentElement.classList.toggle("dark", getTheme() === "dark");
}
