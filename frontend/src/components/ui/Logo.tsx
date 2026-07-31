import { Scroll } from "lucide-react";
import { cn } from "../../lib/cn";

/*
  Lockup da marca: o pergaminho mais o wordmark HISTORYAI.

  Estava repetido inline na landing, na sidebar e no auth, cada um com um
  tamanho e um espaçamento levemente diferente. Centralizar aqui é o que
  garante que os três continuem iguais quando um deles mudar.

  A cor NÃO é fixa: tudo herda `currentColor` a partir de `text-accent`, que
  é âmbar escuro no tema claro (#92400e) e âmbar claro no escuro (#fbbf24).
  Um SVG com a cor embutida ficaria ilegível em um dos dois temas.

  O wordmark é texto de verdade, não um path: ele é chrome da interface, então
  usa Rubik (--font-system) como o resto do sistema e acompanha o tamanho de
  fonte do usuário. Vetorizar as letras congelaria a fonte e quebraria a busca
  na página.
*/

type Size = "sm" | "md" | "lg";

const ICON_SIZE: Record<Size, number> = { sm: 18, md: 22, lg: 40 };

/** Caixa arredondada atrás do ícone. Proporcional ao ícone. */
const BOX: Record<Size, string> = {
  sm: "w-9 h-9 rounded-xl",
  md: "w-11 h-11 rounded-xl",
  lg: "w-16 h-16 rounded-2xl",
};

const WORDMARK: Record<Size, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

const GAP: Record<Size, string> = { sm: "gap-2", md: "gap-2.5", lg: "gap-3" };

interface Props {
  /** "lockup" = ícone + wordmark; "mark" = só o pergaminho. */
  variant?: "lockup" | "mark";
  size?: Size;
  /** Desenha o ícone dentro da caixa âmbar. Sem isso ele fica solto. */
  boxed?: boolean;
  className?: string;
}

export default function Logo({
  variant = "lockup",
  size = "sm",
  boxed = false,
  className,
}: Props) {
  const icon = (
    <Scroll
      size={ICON_SIZE[size]}
      strokeWidth={size === "lg" ? 1.5 : 2}
      aria-hidden="true"
      className="shrink-0"
    />
  );

  return (
    <span
      className={cn("inline-flex items-center text-accent", GAP[size], className)}
    >
      {boxed ? (
        <span
          className={cn(
            "grid place-items-center shrink-0",
            "bg-accent-wash border border-accent-line",
            BOX[size],
          )}
        >
          {icon}
        </span>
      ) : (
        icon
      )}

      {variant === "lockup" && (
        <span
          className={cn(
            "font-system font-semibold tracking-widest truncate",
            WORDMARK[size],
          )}
        >
          HISTORYAI
        </span>
      )}
    </span>
  );
}
