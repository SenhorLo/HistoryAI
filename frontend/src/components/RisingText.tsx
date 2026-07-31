import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { useFramesAreRunning } from "../hooks/useFramesAreRunning";

/*
  Flag de módulo, não estado: sobrevive a remontagens do componente e zera
  sozinha no reload. É exatamente a regra pedida — a entrada roda uma vez por
  carregamento da página. Depois disso, abrir uma nova conversa remonta a tela
  vazia e o texto aparece estático.
*/
let hasPlayedThisPageLoad = false;

interface Props {
  text: string;
  className?: string;
  /** Atraso antes da primeira letra, para encadear blocos. */
  delayMs?: number;
  as?: "h1" | "h2" | "p" | "span";
}

/**
 * Texto com as letras subindo, uma a uma.
 *
 * Acessibilidade: quebrar a frase em um span por caractere faria o leitor de
 * tela soletrar, então a versão fatiada é sempre `aria-hidden`. Como o texto
 * real volta para a árvore depende do elemento:
 *
 * - **Heading**: `aria-label`. O nome de um heading é calculado a partir do
 *   conteúdo, e — medido na árvore de acessibilidade — o `aria-hidden` dos
 *   caracteres não bastava: o nome saía duplicado. `aria-label` é nome vindo
 *   do autor e tem precedência sobre o conteúdo, o que elimina a duplicação.
 * - **Parágrafo/span**: `sr-only`. Esses elementos têm papel genérico, onde
 *   `aria-label` não é garantido — o texto some se o AT ignorar o atributo.
 */
export default function RisingText({
  text,
  className,
  delayMs = 0,
  as: Tag = "span",
}: Props) {
  const framesRunning = useFramesAreRunning();
  // capturado no primeiro render: todos os blocos montados no mesmo
  // carregamento leem `false` antes de qualquer efeito rodar, então animam
  // juntos em vez de só o primeiro
  const [isFirstLoad] = useState(() => !hasPlayedThisPageLoad);

  useEffect(() => {
    if (isFirstLoad && framesRunning) hasPlayedThisPageLoad = true;
  }, [isFirstLoad, framesRunning]);

  const animate = isFirstLoad && framesRunning;

  const words = text.split(" ");
  let charIndex = 0;
  const isHeading = Tag === "h1" || Tag === "h2";

  return (
    <Tag className={className} aria-label={isHeading ? text : undefined}>
      {!isHeading && <span className="sr-only">{text}</span>}
      <span
        aria-hidden="true"
        className={animate ? "is-rising" : undefined}
        style={{ "--rise-delay": `${delayMs}ms` } as CSSProperties}
      >
        {words.map((word, wi) => (
          <Fragment key={wi}>
            {/* a palavra inteira é inline-block para não quebrar no meio */}
            <span className="inline-block">
              {[...word].map((ch, ci) => (
                <span
                  key={ci}
                  data-char=""
                  style={{ "--char-index": charIndex++ } as CSSProperties}
                >
                  {ch}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
