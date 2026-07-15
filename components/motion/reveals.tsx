"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const VIEWPORT = { once: true, amount: 0.18, margin: "0px 0px -8% 0px" } as const;

/** Entrada básica: sube y funde al entrar en el viewport. */
export function FadeUp({
  children,
  className = "",
  delay = 0,
  y = 34,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Reveal por recorte para titulares. El motion exterior (sin clip) es el que
 * observa el viewport y propaga la variante al hijo recortado: Chrome aplica
 * el clip-path del propio elemento al calcular la intersección, así que un
 * elemento recortado a área cero nunca dispararía por sí mismo.
 * El inset final es negativo para no rebanar la virgulilla de la Ñ.
 */
export function ClipReveal({
  children,
  className = "",
  innerClassName = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      <motion.div
        className={innerClassName}
        variants={{
          hidden: { clipPath: "inset(0% 0% 100% 0%)", y: 14 },
          show: {
            clipPath: "inset(-15% 0% -15% 0%)",
            y: 0,
            transition: { duration: 1.1, ease: EASE_OUT, delay },
          },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 38 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
};

/** Contenedor que escalona la entrada de sus StaggerItem hijos. */
export function StaggerGroup({
  children,
  className = "",
  as = "div",
  stagger = 0.09,
  delay = 0,
  amount = 0.12,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul";
  stagger?: number;
  delay?: number;
  amount?: number;
}) {
  const Comp = as === "ul" ? motion.ul : motion.div;
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp className={className} variants={ITEM_VARIANTS}>
      {children}
    </Comp>
  );
}
