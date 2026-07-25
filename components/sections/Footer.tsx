"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import SmokeText from "@/components/motion/SmokeText";
import { useMediaQuery } from "@/lib/useMediaQuery";

const COLS = [
  {
    title: "Producto",
    links: ["Stratum 3L", "Guía de tallas", "Cuidados", "Reparaciones"],
  },
  {
    title: "Soporte",
    links: ["Envíos", "Devoluciones", "Garantía", "Contacto"],
  },
  {
    title: "Vetta",
    links: ["Manifiesto", "Field tests", "Sostenibilidad", "Prensa"],
  },
];

/**
 * Footer telón: en pantallas grandes queda fijo detrás de la página (z-0) y
 * el contenido (z-10) se levanta al final del scroll revelándolo. El spacer
 * reserva el hueco de scroll. En móvil, flujo normal.
 */
export default function Footer() {
  // En escritorio el footer está fijo detrás de la página: geométricamente
  // "en viewport" desde el primer scroll, así que sus animaciones se
  // dispararían ocultas. El spacer sí vive en el flujo al final del
  // documento: cuando asoma, el telón se está revelando de verdad.
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const revealed = useInView(spacerRef, { once: true, amount: 0.15 });
  const isCurtain = useMediaQuery("(min-width: 1024px)");
  const show = revealed || !isCurtain;

  return (
    <>
      <div
        ref={spacerRef}
        className="hidden lg:block lg:h-[78vh]"
        aria-hidden="true"
      />
      <footer className="overflow-hidden border-t border-bone/10 bg-coal px-6 pb-10 pt-20 sm:px-10 lg:fixed lg:inset-x-0 lg:bottom-0 lg:z-0 lg:flex lg:h-[78vh] lg:flex-col lg:justify-center lg:pt-0">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <SmokeText when={show}>
              <p className="font-display text-6xl uppercase leading-none text-outline sm:text-8xl">
                Vetta
              </p>
              <p className="mt-5 max-w-xs font-mono text-[11px] uppercase leading-loose tracking-[0.22em] text-bone-dim">
                Equipo de montaña
                <br />
                Diseñado en los Pirineos
              </p>
            </SmokeText>
            {COLS.map((col, i) => (
              <SmokeText
                key={col.title}
                delay={0.12 + i * 0.14}
                when={show}
              >
                <nav aria-label={col.title}>
                  <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-olive">
                    {col.title}
                  </p>
                  <ul className="space-y-3">
                    {col.links.map((link) => (
                      <li key={link}>
                        <motion.a
                          href="#top"
                          whileHover={{ x: 6 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 24 }}
                          className="inline-block text-sm text-bone-dim transition-colors hover:text-bone"
                        >
                          {link}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SmokeText>
            ))}
          </div>
          <SmokeText animationMode="inPlace" delay={0.3} when={show}>
            <p className="mt-20 border-t border-bone/10 pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dim/70">
              © 2026 Vetta Mountain Equipment — Página ficticia de demostración
            </p>
          </SmokeText>
        </div>
      </footer>
    </>
  );
}
