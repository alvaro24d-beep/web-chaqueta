"use client";

import { useScroll, useSpring, useVelocity } from "framer-motion";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Frontera de sección viva, pintada en <canvas>. Nada de filtros SVG: los
 * filtros CSS referenciados sufren bugs de invalidación/composición en
 * Chromium (bindings de feImage congelados, desplazamientos que dejan de
 * renderizarse junto a clip-paths...) que causaban la "línea lisa"
 * intermitente. Aquí controlamos cada frame:
 *
 * - Cresta de montaña + cinta del color de la sección + cordillera de bruma
 *   + línea ember con pulso recorriéndola, dibujadas en un lienzo fuente.
 * - Falla: el lienzo se compone por rebanadas verticales desplazadas por un
 *   ruido determinista de dos octavas (trozos coherentes, sin parches
 *   calmados) que DERIVA en el tiempo y se amplifica con la velocidad de
 *   scroll.
 * - La cinta llega hasta el borde inferior (= top de la sección, misma
 *   tinta): no existe borde fijo que pueda asomar entre los granos.
 *
 * Solo corre con la frontera a la vista (IntersectionObserver) y con
 * prefers-reduced-motion pinta la silueta estática.
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

/**
 * Cola del lienzo que se adentra en la sección (px CSS): los valles de la
 * cresta se asientan JUSTO en la división y la cinta se funde sobre el
 * arranque de la sección con un degradado de alpha — la unión queda tapada
 * por la falla, sin costuras rectas.
 */
const TAIL = 40;

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
    let tail = 0;
    let src: HTMLCanvasElement | null = null;
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

    // Lienzo fuente: la frontera nítida (se desgarra al componer).
    const drawSource = (pulseT: number) => {
      if (!src) return;
      const s = src.getContext("2d");
      if (!s) return;
      s.clearRect(0, 0, W, H);

      // Cordillera de bruma tras la cresta
      s.globalAlpha = 0.5;
      tracePath(s, back, 0);
      for (let i = back.length - 1; i >= 0; i--) {
        s.lineTo(mapX(back[i][0]), mapY(back[i][1] + 20));
      }
      s.closePath();
      s.fillStyle = fill;
      s.fill();
      s.globalAlpha = 1;

      // Cinta: de la cresta hasta el borde inferior (= top de la sección)
      tracePath(s, pts, -8);
      s.lineTo(W, H);
      s.lineTo(0, H);
      s.closePath();
      s.fillStyle = fill;
      s.fill();

      // Línea ember de la cresta
      tracePath(s, pts, 0);
      s.strokeStyle = "#ff5b1f";
      s.globalAlpha = 0.78;
      s.lineWidth = 2 * dpr;
      s.stroke();
      s.globalAlpha = 1;

      // Pulso recorriendo la cresta
      const len = crestLength();
      tracePath(s, pts, 0);
      s.strokeStyle = "#ffa270";
      s.lineWidth = 2.5 * dpr;
      s.setLineDash([len * 0.06, len * 0.94]);
      s.lineDashOffset = -pulseT * len;
      s.stroke();
      s.setLineDash([]);

      // Fundido de la cola: bajo la división, la cinta se disuelve sobre el
      // contenido de la sección (sin arista recta de cierre).
      const fadeTop = H - tail;
      const grad = s.createLinearGradient(0, fadeTop, 0, H - 2 * dpr);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,1)");
      s.globalCompositeOperation = "destination-out";
      s.fillStyle = grad;
      s.fillRect(0, fadeTop, W, tail);
      s.globalCompositeOperation = "source-over";
    };

    // Composición: rebanadas verticales desplazadas por el ruido derivante.
    const render = (now: number) => {
      if (!src) return;
      drawSource((now / 6500) % 1);
      ctx.clearRect(0, 0, W, H);
      const v = Math.abs(smoothVelocity.get());
      const amp = (14 + Math.min(20, v * 0.03)) * dpr;
      const drift = (now / 1000) * 90;
      const slice = Math.max(2, Math.round(3 * dpr));
      for (let x = 0; x < W; x += slice) {
        const u = (x / dpr + drift) & (N - 1);
        const n = 0.68 * NOISE_BIG[u] + 0.45 * NOISE_FINE[(u * 5 + 700) & (N - 1)];
        const dy = n * amp;
        ctx.drawImage(src, x, 0, slice, H, x, dy, slice, H);
      }
    };

    const renderStatic = () => {
      if (!src) return;
      drawSource(0.35);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(src, 0, 0);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.round(rect.width * dpr);
      H = Math.round(rect.height * dpr);
      tail = TAIL * dpr;
      // Los valles de la cresta (y=70 del viewBox) caen en la división
      // (H - tail); lo demás se reparte por encima.
      crestH = (isDesktop ? 112 : 96) * dpr;
      head = H - tail - (70 / 120) * crestH;
      canvas.width = W;
      canvas.height = H;
      src = document.createElement("canvas");
      src.width = W;
      src.height = H;
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
    // top-10 + -translate-y-full: el lienzo se adentra TAIL px en la sección
    // para que la falla tape la unión (los valles caen en la división).
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-10 z-10 h-[140px] -translate-y-full sm:h-[156px]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
