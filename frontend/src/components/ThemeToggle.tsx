import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";
import { IconButton } from "./ui/Button";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, toggle] = useTheme();
  const isDark = theme === "dark";

  return (
    <IconButton
      type="button"
      label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-pressed={isDark}
      onClick={toggle}
      className={`border border-subtle bg-surface-sunken ${className}`}
    >
      {isDark ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </IconButton>
  );
}
