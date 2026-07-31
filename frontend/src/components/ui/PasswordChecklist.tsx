import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "../../lib/validation";
import { cn } from "../../lib/cn";

/**
 * Lista de requisitos da senha, marcada conforme o usuário digita.
 *
 * Mostrar os requisitos o tempo todo (e não só o erro depois de enviar) é o
 * que evita o vaivém de tentar, errar e adivinhar o que falta.
 *
 * O bloco inteiro é aria-hidden e há um resumo em `role="status"` no lugar:
 * anunciar quatro itens mudando de estado a cada tecla viraria ruído
 * ininterrupto no leitor de tela.
 */
export default function PasswordChecklist({ value }: { value: string }) {
  // .map(label): sem isto o join() serializava os objetos de regra e o
  // leitor de tela ouvia "Faltam: [object Object], [object Object]"
  const pending = PASSWORD_RULES.filter((r) => !r.test(value)).map(
    (r) => r.label,
  );

  return (
    <div className="-mt-3 mb-5">
      <ul aria-hidden="true" className="ui-text grid gap-1 text-xs">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 transition-colors duration-200",
                ok ? "text-accent" : "text-ink-subtle",
              )}
            >
              {ok ? (
                <Check size={13} strokeWidth={3} />
              ) : (
                <Circle size={13} strokeWidth={2} />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>

      {/* resumo estável: só muda quando o conjunto pendente muda */}
      <p className="sr-only" role="status">
        {value.length === 0
          ? ""
          : pending.length === 0
            ? "Senha atende a todos os requisitos."
            : `Faltam: ${pending.join(", ").toLowerCase()}.`}
      </p>
    </div>
  );
}
