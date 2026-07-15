"use client";

import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useCallback, useEffect, useId, useRef } from "react";

/**
 * Frontera de sección viva. La división real la hace un clip-path de cresta
 * sobre la propia sección (.ridge-clip en globals.css, mismos puntos que
 * aquí): arriba se ve la sección anterior y abajo esta, tocándose en los
 * picos, sin bandas de relleno.
 *
 * Este componente añade la decoración sobre esa frontera (va FUERA de la
 * sección recortada, como hermano, para que el clip no se lo coma):
 * - Cordillera de bruma translúcida derivando sobre la sección anterior.
 * - Línea ember siguiendo la cresta + pulso recorriéndola.
 * - Cinta del color de la sección abrazando la cresta, que junto al resto
 *   pasa por un feDisplacementMap con el ruido horneado: el borde está
 *   erosionado en arena DESDE QUE ASOMA (base constante) y la falla crece
 *   con la velocidad de scroll. Sin aristas horizontales rectas en el
 *   contenido filtrado: nada que desgarrar donde no toca.
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

const BACK_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 84],
  [72, 34],
  [156, 62],
  [228, 14],
  [312, 50],
  [396, 24],
  [480, 58],
  [576, 10],
  [660, 44],
  [756, 20],
  [840, 54],
  [924, 12],
  [1020, 40],
  [1104, 26],
  [1188, 52],
  [1284, 16],
  [1368, 44],
  [1440, 84],
];

const ridgeLine = (
  pts: ReadonlyArray<readonly [number, number]>,
  dy = 0,
) => `M${pts.map(([x, y]) => `${x},${y + dy}`).join("L")}`;

/** Banda cerrada que sigue la cresta (sin aristas horizontales rectas). */
const ridgeBand = (
  pts: ReadonlyArray<readonly [number, number]>,
  top: number,
  bottom: number,
) =>
  `${ridgeLine(pts, top)}L${[...pts]
    .reverse()
    .map(([x, y]) => `${x},${y + bottom}`)
    .join("L")}Z`;

const CREST_LINE = ridgeLine(POINTS);
const CREST_RIBBON = ridgeBand(POINTS, -5, 21);
const HAZE_BAND = ridgeBand(BACK_POINTS, 0, 26);

export default function SectionDivider({ fill }: { fill: string }) {
  const rawId = useId();
  const filterId = `erode${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const hazeRef = useRef<SVGSVGElement | null>(null);
  const crestRef = useRef<SVGSVGElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const lastScaleRef = useRef(-1);
  const inViewRef = useRef(false);
  const reduced = useReducedMotion();

  const { scrollY } = useScroll();
  const smoothVelocity = useSpring(useVelocity(scrollY), {
    damping: 50,
    stiffness: 400,
  });

  // Falla base constante + impulso por velocidad de scroll.
  const erosion = useTransform(
    () => 26 + Math.min(62, Math.abs(smoothVelocity.get()) * 0.055),
  );

  const applyFilter = useCallback(
    (scale: number) => {
      if (scale >= 6) {
        dispRef.current?.setAttribute("scale", String(scale));
      }
      for (const el of [hazeRef.current, crestRef.current]) {
        if (el) el.style.filter = scale >= 6 ? `url(#${filterId})` : "none";
      }
    },
    [filterId],
  );

  useMotionValueEvent(erosion, "change", (v) => {
    if (reduced || !inViewRef.current) return;
    const q = Math.round(v / 6) * 6;
    if (q === lastScaleRef.current) return;
    lastScaleRef.current = q;
    applyFilter(q);
  });

  // Activación por visibilidad (la frontera está erosionada desde que asoma).
  useEffect(() => {
    const target = crestRef.current;
    if (!target || reduced) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        inViewRef.current = visible;
        if (visible) {
          const q = Math.max(24, Math.round(erosion.get() / 6) * 6);
          lastScaleRef.current = q;
          applyFilter(q);
        } else {
          lastScaleRef.current = -1;
          applyFilter(0);
        }
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [applyFilter, erosion, reduced]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-10"
    >
      <svg width="0" height="0" className="absolute">
        <filter
          id={filterId}
          x="-20%"
          y="-120%"
          width="140%"
          height="340%"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href="/sand-noise.png"
            x="0"
            y="0"
            width="512"
            height="256"
            result="img"
          />
          <feTile in="img" result="noise" />
          <feDisplacementMap
            ref={dispRef}
            in="SourceGraphic"
            in2="noise"
            scale="0"
            xChannelSelector="G"
            yChannelSelector="R"
          />
        </filter>
      </svg>

      {/* Bruma: cordillera translúcida derivando sobre la sección anterior */}
      <div className="absolute inset-x-0 bottom-0 h-16 overflow-hidden sm:h-28">
        <svg
          ref={hazeRef}
          className="divider-back absolute bottom-0 left-0 h-full w-[200%]"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <path d={HAZE_BAND} fill={fill} opacity="0.5" />
          <path
            d={HAZE_BAND}
            fill={fill}
            opacity="0.5"
            transform="translate(1440 0)"
          />
        </svg>
      </div>

      {/* Cresta: cinta + línea ember + pulso, alineadas con el clip-path */}
      <svg
        ref={crestRef}
        className="absolute left-0 top-0 h-16 w-full sm:h-28"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d={CREST_RIBBON} fill={fill} />
        <path
          d={CREST_LINE}
          fill="none"
          stroke="#ff5b1f"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          opacity="0.75"
        />
        <path
          className="divider-pulse"
          d={CREST_LINE}
          pathLength={100}
          fill="none"
          stroke="#ffa270"
          strokeWidth="2.5"
          strokeDasharray="6 94"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
