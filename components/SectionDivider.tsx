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
import { useMediaQuery } from "@/lib/useMediaQuery";

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

// Cordillera trasera: abraza la cresta (sus picos asoman apenas por encima
// de los picos frontales y sus valles quedan detrás de la cinta).
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

// Variante móvil: la mitad de picos — 17 puntos comprimidos en ~390px se
// verían como un serrucho fino; el clip .ridge-clip móvil usa estos mismos.
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

// La cinta entierra el borde del clip-path (situado a +20 unidades bajo la
// cresta) con margen simétrico ≥ desplazamiento máximo del filtro: el borde
// fijo nunca asoma entre los granos.
const CREST = {
  desktop: {
    line: ridgeLine(POINTS),
    ribbon: ridgeBand(POINTS, -8, 48),
    haze: ridgeBand(BACK_POINTS, 0, 20),
  },
  mobile: {
    line: ridgeLine(MOBILE_POINTS),
    ribbon: ridgeBand(MOBILE_POINTS, -8, 48),
    haze: ridgeBand(MOBILE_BACK_POINTS, 0, 20),
  },
} as const;

export default function SectionDivider({ fill }: { fill: string }) {
  const rawId = useId();
  const filterId = `erode${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const hazeRef = useRef<SVGSVGElement | null>(null);
  const crestRef = useRef<SVGSVGElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const feImageRef = useRef<SVGFEImageElement | null>(null);
  const lastScaleRef = useRef(-1);
  const lastNoiseXRef = useRef(0);
  const inViewRef = useRef(false);
  const reduced = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const shapes = isDesktop ? CREST.desktop : CREST.mobile;

  const { scrollY } = useScroll();
  const smoothVelocity = useSpring(useVelocity(scrollY), {
    damping: 50,
    stiffness: 400,
  });

  // Falla base constante + impulso por velocidad de scroll. Tope en 44
  // (±22px): nunca supera el margen de la cinta sobre el borde del clip.
  const erosion = useTransform(
    () => 24 + Math.min(20, Math.abs(smoothVelocity.get()) * 0.03),
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

  // Activación por visibilidad (la frontera está erosionada desde que asoma)
  // + deriva continua del campo de ruido: la falla repta sola, también con
  // el scroll parado. rAF propio porque SMIL sobre primitivas de filtro no
  // repinta filtros CSS referenciados en Chromium.
  useEffect(() => {
    const target = crestRef.current;
    if (!target || reduced) return;

    let raf = 0;
    const drift = (now: number) => {
      if (!inViewRef.current) return;
      // ~64 px/s en pasos de 2px (feTile envuelve sin costura)
      const x = Math.round((-((now / 1000) * 64) % 512) / 2) * 2;
      if (x !== lastNoiseXRef.current) {
        lastNoiseXRef.current = x;
        feImageRef.current?.setAttribute("x", String(x));
      }
      raf = requestAnimationFrame(drift);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible === inViewRef.current) return;
        inViewRef.current = visible;
        if (visible) {
          const q = Math.max(24, Math.round(erosion.get() / 6) * 6);
          lastScaleRef.current = q;
          applyFilter(q);
          raf = requestAnimationFrame(drift);
        } else {
          lastScaleRef.current = -1;
          applyFilter(0);
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    io.observe(target);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
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
            ref={feImageRef}
            href="/sand-noise.png"
            x="0"
            y="0"
            width="512"
            height="256"
            result="img"
          />
          <feTile in="img" result="noise" />
          {/* Contraste x2: satura el ruido hacia los extremos para que no
              queden tramos "neutros" con el borde nítido (el máximo de
              desplazamiento no cambia: el canal se recorta a [0,1]). */}
          <feComponentTransfer in="noise" result="wind">
            <feFuncR type="linear" slope="2" intercept="-0.5" />
            <feFuncG type="linear" slope="2" intercept="-0.5" />
          </feComponentTransfer>
          <feDisplacementMap
            ref={dispRef}
            in="SourceGraphic"
            in2="wind"
            scale="0"
            xChannelSelector="G"
            yChannelSelector="R"
          />
        </filter>
      </svg>

      {/* Cordillera trasera: deriva pegada a la cresta, asomando tras los
          picos (se pinta antes que la cresta → queda detrás de la cinta) */}
      <div className="absolute inset-x-0 top-0 h-24 overflow-hidden sm:h-28">
        <svg
          ref={hazeRef}
          className="divider-back absolute left-0 top-0 h-full w-[200%]"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <path d={shapes.haze} fill={fill} opacity="0.5" />
          <path
            d={shapes.haze}
            fill={fill}
            opacity="0.5"
            transform="translate(1440 0)"
          />
        </svg>
      </div>

      {/* Cresta: cinta + línea ember + pulso, alineadas con el clip-path */}
      <svg
        ref={crestRef}
        className="absolute left-0 top-0 h-24 w-full sm:h-28"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d={shapes.ribbon} fill={fill} />
        <path
          d={shapes.line}
          fill="none"
          stroke="#ff5b1f"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          opacity="0.75"
        />
        <path
          className="divider-pulse"
          d={shapes.line}
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
