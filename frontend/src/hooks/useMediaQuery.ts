import { useCallback, useSyncExternalStore } from "react";

/**
 * Assina uma media query. Usado para saber se a sidebar está em modo
 * "gaveta" (mobile) ou fixa (desktop) — decisão que precisa existir em JS,
 * não só em CSS, porque `inert` e o gerenciamento de foco dependem dela.
 */
export function useMediaQuery(query: string): boolean {
  // subscribe estável: como identidade nova a cada render faria o
  // useSyncExternalStore reassinar sem necessidade
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Breakpoint `md` do Tailwind. */
export const useIsDesktop = () => useMediaQuery("(min-width: 48rem)");
