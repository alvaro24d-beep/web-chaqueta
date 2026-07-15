"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Smooth scroll con Lenis, solo en escritorio (puntero fino + hover) y
 * respetando prefers-reduced-motion. En móvil/táctil se mantiene el scroll
 * nativo; las anclas usan el scroll-behavior: smooth del CSS.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const isDesktop = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!isDesktop || reducedMotion) return;

    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      duration: 1.15,
    });

    return () => lenis.destroy();
  }, []);

  return null;
}
