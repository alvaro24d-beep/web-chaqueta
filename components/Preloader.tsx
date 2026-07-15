"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { frameProgress, onFrameLoad, preloadSequences } from "@/lib/frameStore";
import { ALL_SEQUENCES } from "@/lib/frames";

/**
 * Pantalla de carga: descarga TODOS los fotogramas de las secuencias antes
 * de soltar la página, para que el scrollytelling vaya siempre a fotograma
 * exacto. Bloquea el scroll mientras tanto y sale con un fundido.
 */
export default function Preloader() {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    preloadSequences(ALL_SEQUENCES);

    const update = () => {
      const { loaded, total } = frameProgress();
      const p = total > 0 ? loaded / total : 1;
      setPct(Math.round(p * 100));
      if (total > 0 && loaded >= total) setDone(true);
    };
    update();
    const unsubscribe = onFrameLoad(update);

    // Red de seguridad: si algo se atasca, no dejamos la web bloqueada.
    const failsafe = setTimeout(() => setDone(true), 60000);
    return () => {
      unsubscribe();
      clearTimeout(failsafe);
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
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
