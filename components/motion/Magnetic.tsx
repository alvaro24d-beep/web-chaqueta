"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { PointerEvent, ReactNode } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/** Envoltorio magnético: el contenido persigue al cursor con muelles. */
export default function Magnetic({
  children,
  className = "",
  strength = 0.35,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 180, damping: 14, mass: 0.25 };
  const x = useSpring(mx, spring);
  const y = useSpring(my, spring);
  // En táctil el "magnetismo" haría saltar el botón al tocarlo (falso hover).
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!finePointer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    my.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      style={{ x, y }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}
