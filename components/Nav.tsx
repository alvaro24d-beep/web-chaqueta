"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { usePageReady } from "@/lib/frameStore";

const LINKS = [
  { href: "#detalles", label: "Detalles" },
  { href: "#pro", label: "Pro" },
  { href: "#ajuste", label: "Ajuste" },
  { href: "#field-test", label: "Field test" },
];

const LIST: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } },
};

const ITEM: Variants = {
  hidden: { y: -18, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Nav() {
  const [hovered, setHovered] = useState<string | null>(null);
  // La entrada espera a que el Preloader suelte la página.
  const ready = usePageReady();

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={ready ? { y: 0, opacity: 1 } : { y: -70, opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="fixed inset-x-0 top-0 z-50 mix-blend-difference text-white"
    >
      <nav className="flex items-center justify-between px-5 py-5 sm:px-10">
        <motion.a
          href="#top"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="font-display text-2xl uppercase tracking-wide"
        >
          Vetta<span className="text-ember">▲</span>
        </motion.a>
        <motion.ul
          variants={LIST}
          initial="hidden"
          animate={ready ? "show" : "hidden"}
          onMouseLeave={() => setHovered(null)}
          className="hidden items-center gap-9 font-mono text-[11px] uppercase tracking-[0.24em] md:flex"
        >
          {LINKS.map((link) => (
            <motion.li key={link.href} variants={ITEM} className="relative">
              <a href={link.href} onMouseEnter={() => setHovered(link.href)}>
                {link.label}
              </a>
              {hovered === link.href && (
                <motion.span
                  layoutId="nav-underline"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute -bottom-1.5 left-0 right-0 h-px bg-white"
                />
              )}
            </motion.li>
          ))}
        </motion.ul>
        <motion.a
          href="#comprar"
          initial={{ opacity: 0, y: -12 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.65 }}
          whileTap={{ scale: 0.94 }}
          className="border border-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] transition-colors hover:bg-white hover:text-black"
        >
          Comprar — 389 €
        </motion.a>
      </nav>
    </motion.header>
  );
}
