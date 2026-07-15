"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/motion";

/** Palabra que rota en bucle con entrada/salida animadas (AnimatePresence). */
export default function RotatingWord({
  words,
  className = "",
  interval = 2200,
}: {
  words: string[];
  className?: string;
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  // Sin trabajo fuera de pantalla: solo rota mientras se ve.
  const inView = useInView(ref);

  useEffect(() => {
    if (reduced || !inView) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      interval,
    );
    return () => clearInterval(id);
  }, [words.length, interval, reduced, inView]);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ y: "0.8em", opacity: 0 }}
          animate={{ y: "0em", opacity: 1 }}
          exit={{ y: "-0.8em", opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
