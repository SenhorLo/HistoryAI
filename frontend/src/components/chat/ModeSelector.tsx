import { Gauge, Telescope } from "lucide-react";
import { cn } from "../../lib/cn";
import type { AnswerMode } from "../../lib/api";

const OPTIONS = [
  {
    value: "fast" as const,
    icon: Gauge,
    label: "Rápido",
    hint: "Respostas diretas, em poucos parágrafos.",
  },
  {
    value: "optimised" as const,
    icon: Telescope,
    label: "Detalhado",
    hint: "Tratamento acadêmico completo, com historiografia e múltiplas lentes.",
  },
];

/**
 * Controle segmentado compacto, na mesma linha do campo de mensagem.
 *
 * É um grupo de rádio (não abas): a escolha muda o que a PRÓXIMA resposta
 * será. O input nativo dentro de um fieldset já dá navegação por setas.
 *
 * O nome acessível vai num aria-label explícito no input — depender do texto
 * do label não bastava, o leitor de tela anunciava o valor cru ("fast").
 * Por isso o rótulo visível é aria-hidden: senão seria lido duas vezes.
 *
 * Abaixo de `sm` só o ícone aparece: em 375px o texto não cabe ao lado do
 * campo e do botão. A área clicável continua com 44px de altura.
 */
export default function ModeSelector({
  mode,
  onChange,
  disabled,
}: {
  mode: AnswerMode;
  onChange: (mode: AnswerMode) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset
      className="flex shrink-0 gap-0.5 rounded-xl bg-surface-hover p-0.5"
      disabled={disabled}
    >
      <legend className="sr-only">Profundidade da resposta</legend>
      {OPTIONS.map(({ value, icon: Icon, label, hint }) => {
        const active = mode === value;
        return (
          <label
            key={value}
            className={cn(
              // min-w-11 sustenta o alvo de 44px quando o rótulo some no mobile
              "flex items-center justify-center gap-1.5 rounded-[0.6rem] px-2.5",
              "min-h-11 min-w-11 text-xs font-semibold",
              "transition-colors duration-200",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              active
                ? "bg-accent-wash text-accent"
                : "text-ink-subtle hover:text-ink",
            )}
          >
            <input
              type="radio"
              name="answer-mode"
              value={value}
              checked={active}
              onChange={() => onChange(value)}
              disabled={disabled}
              aria-label={`${label}. ${hint}`}
              className="sr-only"
            />
            <Icon size={15} aria-hidden="true" />
            <span aria-hidden="true" className="hidden sm:inline">
              {label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
