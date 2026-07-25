import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

/* min-h-11 = 44px: mínimo de alvo de toque. */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "min-h-11 transition-colors duration-200 " +
  "disabled:opacity-60 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent-solid text-on-accent hover:bg-accent-solid-hover",
  secondary:
    "border border-accent-line bg-accent-wash text-accent hover:bg-accent-wash-hover",
  ghost:
    "text-ink-muted hover:bg-surface-hover hover:text-ink",
};

const SIZES: Record<Size, string> = {
  md: "px-5 py-2.5 text-base",
  lg: "px-8 py-3.5 text-lg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    />
  );
}

interface ButtonLinkProps {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

/** Mesma aparência do Button, mas navega — mantém semântica de link. */
export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
    >
      {children}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obrigatório: botão só de ícone precisa de nome acessível. */
  label: string;
  children: ReactNode;
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-lg shrink-0",
        "min-h-11 min-w-11 text-ink-muted",
        "hover:bg-surface-hover hover:text-ink transition-colors duration-200",
        "disabled:opacity-60 disabled:pointer-events-none",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
