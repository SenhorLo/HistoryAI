import { Scroll } from "lucide-react";

const EXAMPLES = [
  "E se a Alemanha tivesse vencido a Segunda Guerra Mundial?",
  "E se Jesus não tivesse sido crucificado?",
  "E se o Império Romano nunca tivesse caído?",
  "E se Sócrates tivesse morrido na Guerra do Peloponeso?",
];

/**
 * Tela vazia com sugestões clicáveis — chat em branco não comunica o que a
 * ferramenta aceita; o exemplo é a instrução.
 */
export default function EmptyState({
  onPickExample,
}: {
  onPickExample: (text: string) => void;
}) {
  return (
    <div className="pt-12 text-center">
      <Scroll
        size={56}
        className="mx-auto mb-4 text-accent"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h1 className="text-3xl font-semibold text-accent mb-3">
        E se a história tivesse sido diferente?
      </h1>
      <p className="text-ink-muted max-w-md mx-auto">
        Proponha um cenário hipotético ou pergunte qualquer coisa sobre
        história, filosofia, sociologia ou teologia.
      </p>

      <p className="overline text-ink-subtle mt-10 mb-3">Comece por aqui</p>
      <ul className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2.5 max-w-2xl mx-auto">
        {EXAMPLES.map((example) => (
          <li key={example}>
            <button
              type="button"
              onClick={() => onPickExample(example)}
              className="w-full sm:w-auto min-h-11 rounded-full border border-accent-line bg-surface-raised px-4 py-2.5 text-sm text-ink-muted hover:bg-accent-wash hover:text-accent transition-colors duration-200"
            >
              {example}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
