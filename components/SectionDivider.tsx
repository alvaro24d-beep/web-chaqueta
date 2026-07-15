"use client";

import { useScroll, useSpring, useVelocity } from "framer-motion";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Frontera de sección viva, pintada en <canvas> (nada de filtros SVG: sufren
 * bugs de invalidación/composición en Chromium). Dos capas:
 *
 * 1. BASE estática: banda sólida del color de la sección que CRUZA la
 *    división (el lienzo se adentra TAIL px en la sección) con borde
 *    inferior dentado — la línea de unión queda siempre tapada, pase lo
 *    que pase con la falla, y sin aristas rectas.
 * 2. CRESTA desgarrada: banda de cordillera + bruma + línea ember con pulso,
 *    compuesta por rebanadas verticales desplazadas por ruido determinista
 *    (deriva temporal + amplificación por velocidad de scroll). Sus valles
 *    se asientan justo sobre la división; cuando un trozo salta, debajo
 *    asoma la base — nunca la unión.
 *
 * Solo corre con la frontera a la vista; reduced-motion = silueta estática.
 */

const POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 70],
  [96, 46],
  [168, 58],
  [264, 34],
  [336, 56],
  [432, 40],
  [528, 64],
  [612, 36],
  [708, 52],
  [804, 42],
  [888, 60],
  [972, 34],
  [1068, 50],
  [1152, 40],
  [1248, 58],
  [1332, 46],
  [1440, 70],
];

const MOBILE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 70],
  [180, 38],
  [360, 58],
  [540, 30],
  [720, 62],
  [900, 36],
  [1080, 54],
  [1260, 40],
  [1440, 70],
];

const BACK_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 58],
  [72, 26],
  [156, 48],
  [228, 14],
  [312, 42],
  [396, 20],
  [480, 50],
  [576, 10],
  [660, 38],
  [756, 18],
  [840, 46],
  [924, 12],
  [1020, 36],
  [1104, 22],
  [1188, 44],
  [1284, 14],
  [1368, 40],
  [1440, 58],
];

const MOBILE_BACK_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 58],
  [144, 24],
  [288, 46],
  [432, 14],
  [576, 50],
  [720, 20],
  [864, 44],
  [1008, 12],
  [1152, 40],
  [1296, 26],
  [1440, 58],
];

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
const NOISE_BIG = makeNoise(N, 40, 123457);
const NOISE_FINE = makeNoise(N, 9, 987651);

/** Cuánto se adentra el lienzo en la sección (px CSS). */
const TAIL = 44;

export default function SectionDivider({ fill }: { fill: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDesktop = useMediaQuery("(min-width: 640px)");
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

    const pts = isDesktop ? POINTS : MOBILE_POINTS;
    const back = isDesktop ? BACK_POINTS : MOBILE_BACK_POINTS;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let head = 0;
    let crestH = 0;
    let divY = 0;
    let srcCrest: HTMLCanvasElement | null = null;
    let srcBase: HTMLCanvasElement | null = null;
    let raf = 0;
    let active = false;

    const mapY = (vb: number) => head + (vb / 120) * crestH;
    const mapX = (vb: number) => (vb / 1440) * W;

    const tracePath = (
      s: CanvasRenderingContext2D,
      p: ReadonlyArray<readonly [number, number]>,
      dy: number,
    ) => {
      s.beginPath();
      s.moveTo(mapX(p[0][0]), mapY(p[0][1] + dy));
      for (let i = 1; i < p.length; i++) {
        s.lineTo(mapX(p[i][0]), mapY(p[i][1] + dy));
      }
    };

    const crestLength = () => {
      let len = 0;
      for (let i = 1; i < pts.length; i++) {
        const dx = mapX(pts[i][0]) - mapX(pts[i - 1][0]);
        const dy = mapY(pts[i][1]) - mapY(pts[i - 1][1]);
        len += Math.hypot(dx, dy);
      }
      return len;
    };

    // BASE estática: de justo bajo la cresta hasta un borde inferior dentado
    // dentro de la sección — la división queda cruzada por banda sólida.
    const drawBase = () => {
      if (!srcBase) return;
      const s = srcBase.getContext("2d");
      if (!s) return;
      s.clearRect(0, 0, W, H);
      tracePath(s, pts, -2);
      const SEGS = 14;
      for (let i = SEGS; i >= 0; i--) {
        const x = (i / SEGS) * W;
        const jag = NOISE_FINE[(i * 137) & (N - 1)] * 8 * dpr;
        s.lineTo(x, divY + 24 * dpr + jag);
      }
      s.closePath();
      s.fillStyle = fill;
      s.fill();
    };

    // CRESTA: bruma + banda de cordillera + línea ember + pulso (se desgarra).
    const drawCrest = (pulseT: number) => {
      if (!srcCrest) return;
      const s = srcCrest.getContext("2d");
      if (!s) return;
      s.clearRect(0, 0, W, H);

      s.globalAlpha = 0.5;
      tracePath(s, back, 0);
      for (let i = back.length - 1; i >= 0; i--) {
        s.lineTo(mapX(back[i][0]), mapY(back[i][1] + 20));
      }
      s.closePath();
      s.fillStyle = fill;
      s.fill();
      s.globalAlpha = 1;

      tracePath(s, pts, -8);
      for (let i = pts.length - 1; i >= 0; i--) {
        s.lineTo(mapX(pts[i][0]), mapY(pts[i][1] + 12));
      }
      s.closePath();
      s.fillStyle = fill;
      s.fill();

      tracePath(s, pts, 0);
      s.strokeStyle = "#ff5b1f";
      s.globalAlpha = 0.78;
      s.lineWidth = 2 * dpr;
      s.stroke();
      s.globalAlpha = 1;

      const len = crestLength();
      tracePath(s, pts, 0);
      s.strokeStyle = "#ffa270";
      s.lineWidth = 2.5 * dpr;
      s.setLineDash([len * 0.06, len * 0.94]);
      s.lineDashOffset = -pulseT * len;
      s.stroke();
      s.setLineDash([]);
    };

    // Composición: base fija + cresta por rebanadas desplazadas por ruido.
    const render = (now: number) => {
      if (!srcCrest || !srcBase) return;
      drawCrest((now / 6500) % 1);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(srcBase, 0, 0);
      const v = Math.abs(smoothVelocity.get());
      const amp = (14 + Math.min(20, v * 0.03)) * dpr;
      const drift = (now / 1000) * 90;
      const slice = Math.max(2, Math.round(3 * dpr));
      for (let x = 0; x < W; x += slice) {
        const u = (x / dpr + drift) & (N - 1);
        const n = 0.68 * NOISE_BIG[u] + 0.45 * NOISE_FINE[(u * 5 + 700) & (N - 1)];
        const dy = n * amp;
        ctx.drawImage(srcCrest, x, 0, slice, H, x, dy, slice, H);
      }
    };

    const renderStatic = () => {
      if (!srcCrest || !srcBase) return;
      drawCrest(0.35);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(srcBase, 0, 0);
      ctx.drawImage(srcCrest, 0, 0);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.round(rect.width * dpr);
      H = Math.round(rect.height * dpr);
      divY = H - TAIL * dpr;
      // Los valles de la cresta (y=70) se asientan justo sobre la división.
      crestH = (isDesktop ? 112 : 96) * dpr;
      head = divY - 6 * dpr - (70 / 120) * crestH;
      canvas.width = W;
      canvas.height = H;
      srcCrest = document.createElement("canvas");
      srcCrest.width = W;
      srcCrest.height = H;
      srcBase = document.createElement("canvas");
      srcBase.width = W;
      srcBase.height = H;
      drawBase();
      if (reducedQuery) renderStatic();
      else render(performance.now());
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
  }, [fill, isDesktop, reducedQuery, smoothVelocity]);

  return (
    // top-11 + -translate-y-full: el lienzo se adentra TAIL px en la sección
    // para que la banda base cruce la división y la falla se asiente en ella.
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-11 z-10 h-[150px] -translate-y-full sm:h-[166px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
