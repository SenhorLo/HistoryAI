import { useEffect, useState } from "react";

/**
 * Confirma que o requestAnimationFrame está de fato rodando antes de liberar
 * qualquer animação que esconda conteúdo no estado inicial.
 *
 * Numa aba em segundo plano — ou em qualquer contexto que não esteja
 * compondo quadros — o rAF não dispara. Uma animação que comece em
 * `opacity: 0` nunca avança e o texto fica invisível para sempre. Aqui só
 * liberamos depois de ver um quadro chegar; se não chegar, a interface fica
 * direto no estado final, que é o resultado correto.
 */
export function useFramesAreRunning(timeoutMs = 800): boolean {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let settled = false;

    const rafId = requestAnimationFrame(() => {
      settled = true;
      setRunning(true);
    });

    const timer = setTimeout(() => {
      if (!settled) cancelAnimationFrame(rafId);
    }, timeoutMs);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [timeoutMs]);

  return running;
}
