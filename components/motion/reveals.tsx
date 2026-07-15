"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const VIEWPORT = { once: true, amount: 0.18, margin: "0px 0px -8% 0px" } as const;

/**
 * Entrada al viewport SIN el clásico "desde abajo": lateral, zoom o fundido
 * en el sitio. Para contenido dentro de escenas fijadas usa <Shot> (PinScene).
 */
export function SlideIn({
  children,
  className = "",
  delay = 0,
  from = "left",
  distance = 90,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "left" | "right" | "zoom" | "fade";
  distance?: number;
}) {
  const initial =
    from === "left"
      ? { opacity: 0, x: -distance }
      : from === "right"
        ? { opacity: 0, x: distance }
        : from === "zoom"
          ? { opacity: 0, scale: 0.92 }
          : { opacity: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

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
  from = "left",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
  from?: "left" | "right";
}) {
  const Comp = as === "li" ? motion.li : motion.div;
  const variants: Variants = {
    hidden: { opacity: 0, x: from === "left" ? -46 : 46 },
    show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE_OUT } },
  };
  return (
    <Comp className={className} variants={variants}>
      {children}
    </Comp>
  );
}
