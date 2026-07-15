"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Envuelve contenido que entra con una transición al hacerse visible.
 *
 * El observer vigila el contenedor exterior (sin recortes) y la clase `in`
 * activa al hijo interior — un clip-path a área cero en el propio elemento
 * observado haría que Chrome nunca lo considere intersecando.
 * Variantes en globals.css: .reveal (sube + funde) y .reveal-clip (recorte).
 */
export default function Reveal({
  children,
  className = "",
  innerClassName = "",
  variant = "up",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  variant?: "up" | "clip";
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      <div
        className={`${variant === "clip" ? "reveal-clip" : "reveal"} ${innerClassName}`}
        style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
