"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

const fmt = (n: number) => n.toLocaleString("es-ES");

/** Cifra que cuenta de 0 a `to` (formato es-ES) cuando entra en el viewport. */
export default function Counter({
  to,
  duration = 1.6,
  className = "",
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = fmt(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {fmt(to)}
    </span>
  );
}
