"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

/**
 * Sticker circular arrastrable (drag con constraints elásticos e inercia).
 * Colócalo dentro de una sección position: relative; la capa exterior define
 * el área de arrastre sin bloquear clics. Solo en pantallas grandes: en
 * táctil el drag pelearía con el scroll.
 */
export default function DragSticker() {
  const area = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={area}
      aria-hidden="true"
      className="pointer-events-none absolute inset-6 z-10 hidden lg:block"
    >
      <motion.div
        drag
        dragConstraints={area}
        dragElastic={0.18}
        initial={{ rotate: -30, scale: 0, opacity: 0 }}
        whileInView={{ rotate: -12, scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ type: "spring", stiffness: 260, damping: 17, delay: 0.35 }}
        whileHover={{ scale: 1.06, rotate: -4 }}
        whileDrag={{ scale: 1.12, rotate: 8 }}
        className="pointer-events-auto absolute right-[5%] top-[14%] flex h-40 w-40 cursor-grab select-none flex-col items-center justify-center rounded-full bg-ember text-center text-coal active:cursor-grabbing"
      >
        <span className="font-display text-4xl uppercase leading-none">
          315 g
        </span>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em]">
          Ligera de verdad
        </span>
        <span className="mt-3 font-mono text-[8px] uppercase tracking-[0.3em] opacity-60">
          · Arrástrame ·
        </span>
      </motion.div>
    </div>
  );
}
