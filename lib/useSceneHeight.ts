import { useSyncExternalStore } from "react";

const QUERY = "(hover: none), (pointer: coarse)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Altura efectiva (en vh) de una escena de scroll: en pantallas táctiles se
 * multiplica para dar más recorrido — el flick de móvil recorre las escenas
 * demasiado rápido y las coreografías no llegan a apreciarse.
 * (SSR usa la base; el ajuste ocurre tras hidratar, tapado por el Preloader.)
 */
export function useSceneHeightVh(base: number, factor = 1.6) {
  const coarse = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  return coarse ? Math.round(base * factor) : base;
}
