"use client";

import {
  cubicBezier,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  createContext,
  useContext,
  useId,
  useRef,
  type ReactNode,
} from "react";

/**
 * Escena cinematográfica fijada: una sección alta con un contenedor sticky a
 * pantalla completa cuyo contenido se "reproduce" con el scroll (scrubbing).
 * Los hijos <Shot> son planos con un rango [from, to] del progreso que entran
 * y salen por los lados, con zoom o fijos — nunca la columna vertical clásica.
 */

const SceneCtx = createContext<MotionValue<number> | null>(null);

export function useSceneProgress(): MotionValue<number> {
  const value = useContext(SceneCtx);
  if (!value) {
    throw new Error("Shot/ScrubCounter deben usarse dentro de <PinScene>");
  }
  return value;
}

export function PinScene({
  children,
  heightVh = 300,
  className = "",
  id,
  ariaLabel,
}: {
  children: ReactNode;
  heightVh?: number;
  className?: string;
  id?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      className={`relative ${className}`}
      style={{ height: `${heightVh}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <SceneCtx.Provider value={scrollYProgress}>{children}</SceneCtx.Provider>
      </div>
    </section>
  );
}

export type ShotEdge = "left" | "right" | "top" | "bottom" | "zoom" | "none";

const EASE = cubicBezier(0.16, 1, 0.3, 1);
const DIST = 130;

const edgeOffset = (edge: ShotEdge, isExit: boolean) => {
  switch (edge) {
    case "left":
      return { x: -DIST, y: 0, scale: 1 };
    case "right":
      return { x: DIST, y: 0, scale: 1 };
    case "top":
      return { x: 0, y: -DIST, scale: 1 };
    case "bottom":
      return { x: 0, y: DIST, scale: 1 };
    case "zoom":
      // Entra alejado (pequeño) y sale acercándose a cámara (grande).
      return { x: 0, y: 0, scale: isExit ? 1.1 : 0.88 };
    default:
      return { x: 0, y: 0, scale: 1 };
  }
};

const SAND_SCALE = 120;

/**
 * Plano de una PinScene: visible mientras el progreso está en [from, to].
 * Los planos anclados a 0 o 1 no se funden en ese borde (aparecen/permanecen).
 * Posiciónalo solo con inset/flex en className: x/y/scale los pilota el scroll.
 * En las rampas de entrada/salida el contenido se compone/descompone en arena
 * (filtro SVG de desplazamiento por ruido); desactivable con sand={false}.
 */
export function Shot({
  children,
  from,
  to,
  enter = "right",
  exit = "left",
  sand = true,
  className = "",
}: {
  children: ReactNode;
  from: number;
  to: number;
  enter?: ShotEdge;
  exit?: ShotEdge;
  sand?: boolean;
  className?: string;
}) {
  const progress = useSceneProgress();
  const rawId = useId();
  const filterId = `sand${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const outerRef = useRef<HTMLDivElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const reduced = useReducedMotion();
  const span = to - from;
  const hasIn = from > 0.001;
  const hasOut = to < 0.999;
  // Rampas del 30% del rango en cada extremo (epsilon si el borde es fijo:
  // los puntos de useTransform deben ser estrictamente crecientes).
  const frames = [
    from,
    hasIn ? from + span * 0.3 : from + 0.0001,
    hasOut ? to - span * 0.3 : to - 0.0001,
    to,
  ];

  const enterO = hasIn ? edgeOffset(enter, false) : { x: 0, y: 0, scale: 1 };
  const exitO = hasOut ? edgeOffset(exit, true) : { x: 0, y: 0, scale: 1 };

  const opacity = useTransform(progress, frames, [
    hasIn ? 0 : 1,
    1,
    1,
    hasOut ? 0 : 1,
  ]);
  const x = useTransform(progress, frames, [enterO.x, 0, 0, exitO.x], {
    ease: EASE,
  });
  const y = useTransform(progress, frames, [enterO.y, 0, 0, exitO.y], {
    ease: EASE,
  });
  const scale = useTransform(
    progress,
    frames,
    [enterO.scale, 1, 1, exitO.scale],
    { ease: EASE },
  );
  const visibility = useTransform(opacity, (v) =>
    v <= 0.001 ? "hidden" : "visible",
  );

  // La arena sigue la misma rampa que la opacidad: granos al entrar/salir,
  // nítido en el centro del plano. El filtro se aplica a los hijos de
  // contenido (no al plano entero) para acotar el área a repintar.
  useMotionValueEvent(opacity, "change", (v) => {
    if (!sand || reduced) return;
    const outer = outerRef.current;
    const disp = dispRef.current;
    if (!outer || !disp) return;
    const granular = v > 0.001 && v < 0.999;
    if (granular) {
      disp.setAttribute("scale", ((1 - v) * SAND_SCALE).toFixed(1));
    }
    for (const child of outer.children) {
      if (!(child instanceof HTMLElement)) continue;
      child.style.filter = granular ? `url(#${filterId})` : "none";
    }
  });

  return (
    <motion.div
      ref={outerRef}
      style={{ opacity, x, y, scale, visibility }}
      className={`absolute will-change-transform ${className}`}
    >
      {sand && (
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          className="pointer-events-none absolute"
        >
          <filter
            id={filterId}
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed="7"
              result="n"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="n"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      )}
      {children}
    </motion.div>
  );
}

/**
 * Cifra ligada al scrubbing: cuenta de 0 a `to` mientras el progreso de la
 * escena va de `start` a `end` (avanza y retrocede con el scroll).
 */
export function ScrubCounter({
  to,
  start,
  end,
  prefix = "",
  className = "",
}: {
  to: number;
  start: number;
  end: number;
  prefix?: string;
  className?: string;
}) {
  const progress = useSceneProgress();
  const value = useTransform(progress, [start, end], [0, to]);
  const ref = useRef<HTMLSpanElement | null>(null);

  useMotionValueEvent(value, "change", (v) => {
    if (ref.current) {
      ref.current.textContent = prefix + Math.round(v).toLocaleString("es-ES");
    }
  });

  return (
    <span ref={ref} className={className}>
      {prefix}0
    </span>
  );
}
