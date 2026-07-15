"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Barra de progreso de lectura pegada al borde superior. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[90] h-[3px] origin-left bg-ember"
      aria-hidden="true"
    />
  );
}
