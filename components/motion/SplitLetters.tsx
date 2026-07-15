"use client";

import { motion, type Variants } from "framer-motion";

const LETTER: Variants = {
  hidden: { opacity: 0, scale: 1.35, filter: "blur(10px)" },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Divide un texto en letras que enfocan a cámara escalonadas (zoom + blur,
 * nada de subir desde abajo). Sin máscara overflow: con Anton a line-height
 * < 1 la caja de línea recortaría tildes y virgulillas.
 * El contenedor va aria-hidden: pon el texto accesible en el elemento padre.
 */
export default function SplitLetters({
  text,
  className = "",
  delay = 0,
  stagger = 0.045,
  inView = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  /** true: anima al entrar en viewport; false: anima al montar. */
  inView?: boolean;
}) {
  const trigger = inView
    ? ({ whileInView: "show", viewport: { once: true, amount: 0.5 } } as const)
    : ({ animate: "show" } as const);

  return (
    <motion.span
      aria-hidden="true"
      className={`inline-block ${className}`}
      initial="hidden"
      {...trigger}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {Array.from(text).map((letter, i) => (
        <motion.span key={i} className="inline-block" variants={LETTER}>
          {letter === " " ? " " : letter}
        </motion.span>
      ))}
    </motion.span>
  );
}
