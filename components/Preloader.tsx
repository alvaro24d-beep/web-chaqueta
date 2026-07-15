"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  frameProgress,
  onFrameLoad,
  preloadSequences,
  releasePage,
} from "@/lib/frameStore";
import { ALL_SEQUENCES } from "@/lib/frames";
import { EASE_OUT } from "@/lib/motion";

/**
 * Pantalla de carga: descarga TODOS los fotogramas de las secuencias antes
 * de soltar la página, para que el scrollytelling vaya siempre a fotograma
 * exacto. Bloquea el scroll mientras tanto y sale con un fundido.
 */
export default function Preloader() {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const beatRef = useRef(false);

  useEffect(() => {
    preloadSequences(ALL_SEQUENCES);

    let beatTimer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const { loaded, total } = frameProgress();
      const p = total > 0 ? loaded / total : 1;
      setPct(Math.round(p * 100));
      if (total > 0 && loaded >= total && !beatRef.current) {
        // Beat en el 100%: la cifra se clava un instante antes del barrido.
        beatRef.current = true;
        beatTimer = setTimeout(() => {
          setDone(true);
          releasePage();
        }, 450);
      }
    };
    update();
    const unsubscribe = onFrameLoad(update);

    // Red de seguridad: si algo se atasca, no dejamos la web bloqueada.
    // releasePage() también aquí: las animaciones gateadas (nav, hero) deben
    // dispararse igualmente o la página quedaría sin cabecera ni titular.
    const failsafe = setTimeout(() => {
      setDone(true);
      releasePage();
    }, 60000);
    return () => {
      unsubscribe();
      clearTimeout(failsafe);
      if (beatTimer) clearTimeout(beatTimer);
    };
  }, []);

  useEffect(() => {
    if (done) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-coal"
          aria-label="Cargando"
        >
          <p className="font-display text-4xl uppercase tracking-wide">
            Vetta<span className="text-ember">▲</span>
          </p>
          <p className="mt-8 font-display text-6xl leading-none sm:text-7xl">
            {pct}
            <span className="ml-1 text-2xl text-olive">%</span>
          </p>
          <div className="mt-8 h-px w-56 bg-bone/15">
            <motion.div
              animate={{ scaleX: pct / 100 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full origin-left bg-ember"
              style={{ scaleX: 0 }}
            />
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-bone-dim">
            Cargando fotogramas
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
