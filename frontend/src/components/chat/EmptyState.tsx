import { BookOpen, Landmark, Scale } from "lucide-react";
import RisingText from "../RisingText";

const SUGGESTIONS = [
  {
    icon: Landmark,
    title: "Cenário contrafactual",
    text: "E se a Alemanha tivesse vencido a Segunda Guerra Mundial?",
  },
  {
    icon: Scale,
    title: "Ponto de divergência",
    text: "E se Sócrates tivesse morrido na Guerra do Peloponeso?",
  },
  {
    icon: BookOpen,
    title: "Fato histórico",
    text: "Por que o Império Romano do Ocidente caiu em 476?",
  },
];

/**
 * Tela vazia: saudação e sugestões clicáveis em grade.
 * Chat em branco não comunica o que a ferramenta aceita — o exemplo é a
 * instrução, e o título de cada card nomeia o *tipo* de pedido.
 */
export default function EmptyState({
  name,
  onPickExample,
}: {
  name: string;
  onPickExample: (text: string) => void;
}) {

  return (
    <div className="pt-10 pb-2">
      <div className="flex flex-col items-center text-center">
        {name && (
          <RisingText
            as="p"
            text={`Olá, ${name}`}
            className="text-xl md:text-2xl font-semibold text-accent"
          />
        )}
        <RisingText
          as="h1"
          text="Como posso ajudar hoje?"
          // entra depois da saudação, para as duas linhas não competirem
          delayMs={name ? 260 : 0}
          className="mt-1 block text-3xl md:text-4xl font-bold tracking-tight"
        />
        <p className="mt-4 text-ink-muted max-w-lg">
          Proponha um cenário hipotético ou pergunte qualquer coisa sobre
          história, filosofia, sociologia ou teologia.
        </p>
      </div>

      <ul className="mt-10 grid gap-3 sm:grid-cols-3">
        {SUGGESTIONS.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <button
              type="button"
              onClick={() => onPickExample(text)}
              // sem isto o nome sai colado: "Cenário contrafactualE se a..."
              aria-label={`${title}: ${text}`}
              className="group h-full w-full text-left rounded-card border border-subtle bg-surface-raised p-4 hover:border-accent-line hover:bg-accent-wash transition-colors duration-200"
            >
              <Icon
                size={20}
                className="text-accent mb-2.5"
                aria-hidden="true"
              />
              <span className="block font-semibold mb-1">{title}</span>
              <span className="block text-sm text-ink-muted leading-snug">
                {text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
