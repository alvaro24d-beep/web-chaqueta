"use client";

import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useId, useRef } from "react";

/**
 * Separador de sección vivo: cresta de montaña dentada del color de la
 * sección a la que pertenece, colgando de su borde superior. Tres capas de
 * vida:
 *
 * 1. Deriva en paralaje (transform compositado) + morfología de picos
 *    (keyframes CSS sobre `d: path()` — en navegadores sin soporte queda
 *    la silueta estática, que sigue derivando).
 * 2. Pulso ember que recorre la cresta (stroke-dashoffset, pathLength=100).
 * 3. Erosión de arena reactiva al scroll: un feDisplacementMap con el ruido
 *    horneado (/sand-noise.png) desgarra el borde al cruzar el viewport,
 *    amplificado por la velocidad de scroll — quieto se recompone nítido.
 *    Filtro desconectado (`none`) fuera de la transición.
 */

const FRONT_RIDGE =
  "M0,70L96,46L168,58L264,34L336,56L432,40L528,64L612,36L708,52L804,42L888,60L972,34L1068,50L1152,40L1248,58L1332,46L1440,70";
const BACK_RIDGE =
  "M0,84L72,34L156,62L228,14L312,50L396,24L480,58L576,10L660,44L756,20L840,54L924,12L1020,40L1104,26L1188,52L1284,16L1368,44L1440,84";
const closeRidge = (d: string) => `${d}L1440,122L0,122Z`;

const LINE_PROPS = {
  fill: "none",
  strokeWidth: 2,
  vectorEffect: "non-scaling-stroke",
} as const;

export default function SectionDivider({ fill }: { fill: string }) {
  const rawId = useId();
  const filterId = `erode${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const lastScaleRef = useRef(-1);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const { scrollY } = useScroll();
  const smoothVelocity = useSpring(useVelocity(scrollY), {
    damping: 50,
    stiffness: 400,
  });

  // Campana centrada en el cruce del viewport, amplificada por la velocidad:
  // cuanto más rápido pasas la transición, más se deshace el borde en arena.
  const erosion = useTransform(() => {
    const bell = 1 - Math.abs(2 * scrollYProgress.get() - 1);
    const boost = Math.min(56, Math.abs(smoothVelocity.get()) * 0.05);
    return Math.max(0, bell) * (24 + boost);
  });

  useMotionValueEvent(erosion, "change", (v) => {
    if (reduced) return;
    const el = containerRef.current;
    const disp = dispRef.current;
    if (!el || !disp) return;
    const q = Math.round(v / 6) * 6;
    if (q === lastScaleRef.current) return;
    lastScaleRef.current = q;
    if (q < 6) {
      el.style.filter = "none";
    } else {
      disp.setAttribute("scale", String(q));
      el.style.filter = `url(#${filterId})`;
    }
  });

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-px z-10 h-16 -translate-y-full overflow-hidden sm:h-28"
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

      <svg
        className="divider-back absolute bottom-0 left-0 h-full w-[200%]"
        viewBox="0 0 2880 120"
        preserveAspectRatio="none"
      >
        <path
          className="divider-shape-back"
          d={closeRidge(BACK_RIDGE)}
          fill={fill}
          opacity="0.55"
        />
        <path
          className="divider-shape-back"
          d={closeRidge(BACK_RIDGE)}
          fill={fill}
          opacity="0.55"
          transform="translate(1440 0)"
        />
      </svg>

      <svg
        className="divider-front absolute bottom-0 left-0 h-full w-[200%]"
        viewBox="0 0 2880 120"
        preserveAspectRatio="none"
      >
        <path
          className="divider-shape-front-fill"
          d={closeRidge(FRONT_RIDGE)}
          fill={fill}
        />
        <path
          className="divider-shape-front-fill"
          d={closeRidge(FRONT_RIDGE)}
          fill={fill}
          transform="translate(1440 0)"
        />
        <path
          className="divider-shape-front-line"
          d={FRONT_RIDGE}
          stroke="#ff5b1f"
          opacity="0.7"
          {...LINE_PROPS}
        />
        <path
          className="divider-shape-front-line"
          d={FRONT_RIDGE}
          stroke="#ff5b1f"
          opacity="0.7"
          transform="translate(1440 0)"
          {...LINE_PROPS}
        />
        <path
          className="divider-pulse"
          d={FRONT_RIDGE}
          pathLength={100}
          stroke="#ffa270"
          strokeDasharray="6 94"
          strokeLinecap="round"
          {...LINE_PROPS}
          strokeWidth={2.5}
        />
        <path
          className="divider-pulse"
          d={FRONT_RIDGE}
          pathLength={100}
          stroke="#ffa270"
          strokeDasharray="6 94"
          strokeLinecap="round"
          transform="translate(1440 0)"
          {...LINE_PROPS}
          strokeWidth={2.5}
        />
      </svg>
    </div>
  );
}
