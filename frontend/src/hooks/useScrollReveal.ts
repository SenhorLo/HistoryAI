import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useFramesAreRunning } from "./useFramesAreRunning";

// Registrado uma única vez no módulo, não a cada montagem.
// Só o ScrollTrigger entra aqui: `useGSAP` é um hook do React, e passá-lo
// para registerPlugin faz o GSAP tocá-lo fora de um componente — o React
// acusa "Invalid hook call" e a página quebra.
gsap.registerPlugin(ScrollTrigger);

/**
 * Revelação no scroll da landing.
 *
 * Duas decisões que valem registro:
 *
 * 1. Usa `gsap.from`, não `gsap.to`. O estado final é o do CSS, então o
 *    conteúdo nasce visível no HTML: se o bundle não carregar, a página
 *    continua legível e rastreável em vez de ficar em branco.
 *
 * 2. Tudo dentro de `gsap.matchMedia`, com um ramo para
 *    `prefers-reduced-motion: reduce` que não anima nada. O matchMedia
 *    ainda limpa os ScrollTriggers sozinho se a preferência mudar.
 *
 * Intensidade "sutil" do design system: deslocamento de 16px e 300–500ms —
 * lê como aparecimento, não como deslizamento.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const scope = useRef<T>(null);
  const framesRunning = useFramesAreRunning();

  useGSAP(
    () => {
      if (!framesRunning) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          animar: "(prefers-reduced-motion: no-preference)",
          reduzido: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          // quem pediu menos movimento vê o estado final, sem animação
          if (!context.conditions?.animar) return;

          // hero: entra no carregamento, não no scroll — já está na tela, e
          // esperar um scroll que talvez não venha deixaria a dobra parada
          const hero = scope.current?.querySelector("[data-reveal-hero]");
          if (hero) {
            gsap.from(hero.children, {
              opacity: 0,
              y: 20,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
            });
          }

          // blocos avulsos
          gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 16,
              duration: 0.4,
              ease: "power1.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none reverse",
              },
            });
          });

          // listas: os filhos entram em cascata curta
          gsap.utils
            .toArray<HTMLElement>("[data-reveal-stagger]")
            .forEach((group) => {
              gsap.from(group.children, {
                opacity: 0,
                y: 16,
                duration: 0.4,
                stagger: 0.07,
                ease: "power1.out",
                scrollTrigger: {
                  trigger: group,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                },
              });
            });
        },
      );

      return () => mm.revert();
    },
    { scope, dependencies: [framesRunning] },
  );

  return scope;
}
