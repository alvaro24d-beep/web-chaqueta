"use client";

import { useScroll, useSpring, useVelocity } from "framer-motion";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Transición de MATERIA entre secciones — no es un adorno sobre el corte:
 * la sección entrante se materializa desde la anterior con sus PROPIOS
 * píxeles.
 *
 * - Columnas de materia: rebanadas verticales de la sección entrante (el
 *   fotograma REAL del vídeo, copiado en vivo de su canvas; o su color si
 *   es plana) se alzan invadiendo la sección anterior, con alturas de ruido
 *   determinista que derivan en el tiempo y se amplifican con la velocidad
 *   de scroll.
 * - Esquirlas: fragmentos de esa misma materia desprendiéndose por encima.
 * - Puntas ember: línea de energía rota coronando las columnas.
 * - Zona soldada: bajo la división, la copia es 1:1 con la sección real
 *   (mismas filas de píxeles) — no hay corte que tapar: la unión no existe.
 *
 * Canvas puro (sin filtros SVG: minados de bugs en Chromium). Solo corre a
 * la vista (IntersectionObserver); reduced-motion = silueta estática.
 */

/** Ruido 1D determinista, suavizado y teselable (value noise + coseno). */
function makeNoise(n: number, step: number, seedBase: number): Float32Array {
  const coarse = Math.ceil(n / step) + 2;
  const vals = new Float32Array(coarse);
  let seed = seedBase >>> 0;
  for (let i = 0; i < coarse; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    vals[i] = (seed / 4294967296) * 2 - 1;
  }
  vals[coarse - 1] = vals[0];
  vals[coarse - 2] = vals[1];
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = (i / n) * (coarse - 2);
    const i0 = Math.floor(p);
    const t = p - i0;
    const s = (1 - Math.cos(Math.PI * t)) / 2;
    out[i] = vals[i0] * (1 - s) + vals[i0 + 1] * s;
  }
  return out;
}

const N = 2048;
const NOISE_BIG = makeNoise(N, 44, 123457);
const NOISE_FINE = makeNoise(N, 10, 987651);

/**
 * Zona de invasión sobre la sección anterior (px CSS). La zona soldada
 * dentro de la sección son 24px (el top-6 del contenedor; alto total 150).
 */
const ABOVE = 126;
/** Bandas de escalón del glitch bajo la división (px CSS). */
const MID1 = 10;
const MID2 = 17;

export default function SectionDivider({ fill }: { fill: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedQuery = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { scrollY } = useScroll();
  const smoothVelocity = useSpring(useVelocity(scrollY), {
    damping: 50,
    stiffness: 400,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Materia de la sección entrante: su canvas de vídeo (en vivo) o color.
    const section = canvas.closest("section");
    const mat =
      section?.querySelector<HTMLCanvasElement>("[data-seq-canvas]") ?? null;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let boundary = 0;
    let raf = 0;
    let active = false;

    const render = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      const v = Math.abs(smoothVelocity.get());
      const amp = (26 + Math.min(30, v * 0.04)) * dpr;
      const drift = (now / 1000) * 80;
      const slice = Math.max(2, Math.round(4 * dpr));
      const mid1 = MID1 * dpr;
      const mid2 = MID2 * dpr;
      // Escala del canvas fuente: píxeles internos por px CSS.
      const srcScale =
        mat && mat.clientWidth > 0 ? mat.width / mat.clientWidth : 1;
      const toSrc = srcScale / dpr;

      for (let x = 0; x < W; x += slice) {
        const u = (Math.round(x / dpr) + Math.round(drift)) & (N - 1);
        const n =
          (0.62 * NOISE_BIG[u] +
            0.38 * NOISE_FINE[(u * 5 + 700) & (N - 1)] +
            1) /
          2;
        const r = Math.max(2 * dpr, n * amp);
        const r2 = r * 0.45;

        if (mat) {
          const sx = x * toSrc;
          const sw = slice * toSrc;
          // Banda alzada: filas 0.. del vídeo, elevadas r sobre la división
          ctx.drawImage(
            mat,
            sx,
            0,
            sw,
            (r + mid1) * toSrc,
            x,
            boundary - r,
            slice,
            r + mid1,
          );
          // Banda media: medio escalón
          ctx.drawImage(
            mat,
            sx,
            (mid1 + r2) * toSrc,
            sw,
            (mid2 - mid1) * toSrc,
            x,
            boundary + mid1,
            slice,
            mid2 - mid1,
          );
          // Banda soldada: 1:1 con la sección real (mismas filas)
          ctx.drawImage(
            mat,
            sx,
            mid2 * toSrc,
            sw,
            (H - boundary - mid2) * toSrc,
            x,
            boundary + mid2,
            slice,
            H - boundary - mid2,
          );
        } else {
          ctx.fillStyle = fill;
          ctx.fillRect(x, boundary - r, slice, H - boundary + r);
        }

        // Punta ember: energía rota coronando la columna
        ctx.globalAlpha = 0.35 + n * 0.55;
        ctx.fillStyle = "#ff5b1f";
        ctx.fillRect(x, boundary - r - 1.6 * dpr, slice, 1.6 * dpr);
        ctx.globalAlpha = 1;

        // Esquirlas: fragmentos de la misma materia desprendiéndose
        if ((u & 3) === 0) {
          const f = NOISE_FINE[(u * 11 + 90) & (N - 1)];
          const lift = r + 8 * dpr + Math.abs(f) * 34 * dpr;
          const sz = (1.5 + Math.abs(f) * 3) * dpr;
          ctx.globalAlpha = 0.65 * (1 - Math.abs(f) * 0.6);
          if (mat && f > -0.3) {
            ctx.drawImage(
              mat,
              x * toSrc,
              0,
              sz * toSrc,
              sz * toSrc,
              x + f * 10 * dpr,
              boundary - lift,
              sz,
              sz,
            );
          } else {
            ctx.fillStyle = f < -0.65 ? "#ff5b1f" : fill;
            ctx.fillRect(x + f * 10 * dpr, boundary - lift, sz, sz);
          }
          ctx.globalAlpha = 1;
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.round(rect.width * dpr);
      H = Math.round(rect.height * dpr);
      boundary = ABOVE * dpr;
      canvas.width = W;
      canvas.height = H;
      render(reducedQuery ? 4000 : performance.now());
    };

    const tick = (now: number) => {
      if (!active) return;
      render(now);
      raf = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (reducedQuery) return;
        if (visible && !active) {
          active = true;
          raf = requestAnimationFrame(tick);
        } else if (!visible && active) {
          active = false;
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    io.observe(canvas);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [fill, reducedQuery, smoothVelocity]);

  return (
    // El lienzo cubre ABOVE px de la sección anterior y BELOW px de esta
    // (top-6 = BELOW): la materia de la sección se alza desde su propio
    // borde, soldada 1:1 con sus píxeles reales.
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-6 z-10 h-[150px] -translate-y-full"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
