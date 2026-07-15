"use client";

import { motion } from "framer-motion";
import SplitLetters from "@/components/motion/SplitLetters";
import { SlideIn, StaggerGroup, StaggerItem } from "@/components/motion/reveals";

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
  return (
    <>
      <div className="hidden lg:block lg:h-[78vh]" aria-hidden="true" />
      <footer className="overflow-hidden border-t border-bone/10 bg-coal px-6 pb-10 pt-20 sm:px-10 lg:fixed lg:inset-x-0 lg:bottom-0 lg:z-0 lg:flex lg:h-[78vh] lg:flex-col lg:justify-center lg:pt-0">
        <div className="mx-auto w-full max-w-7xl">
          <StaggerGroup
            className="grid gap-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]"
            stagger={0.12}
          >
            <StaggerItem>
              <p
                aria-label="Vetta"
                className="font-display text-6xl uppercase leading-none text-outline sm:text-8xl"
              >
                <SplitLetters text="Vetta" inView stagger={0.07} />
              </p>
              <p className="mt-5 max-w-xs font-mono text-[11px] uppercase leading-loose tracking-[0.22em] text-bone-dim">
                Equipo de montaña
                <br />
                Diseñado en los Pirineos
              </p>
            </StaggerItem>
            {COLS.map((col) => (
              <StaggerItem key={col.title} from="right">
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
                          transition={{ type: "spring", stiffness: 400, damping: 24 }}
                          className="inline-block text-sm text-bone-dim transition-colors hover:text-bone"
                        >
                          {link}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </StaggerItem>
            ))}
          </StaggerGroup>
          <SlideIn from="fade" delay={0.1}>
            <p className="mt-20 border-t border-bone/10 pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dim/70">
              © 2026 Vetta Mountain Equipment — Página ficticia de demostración
            </p>
          </SlideIn>
        </div>
      </footer>
    </>
  );
}
