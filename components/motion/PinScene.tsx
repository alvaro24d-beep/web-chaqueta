"use client";

import {
  animate,
  cubicBezier,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import SectionDivider from "@/components/SectionDivider";
import SandFilter from "@/components/motion/SandFilter";
import { EASE_OUT } from "@/lib/motion";
import { useSceneHeightVh } from "@/lib/useSceneHeight";

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

/** true cuando el progreso de la escena ha cruzado el umbral (reversible). */
export function useSceneCue(threshold: number): boolean {
  const progress = useSceneProgress();
  const [passed, setPassed] = useState(() => progress.get() >= threshold);
  useMotionValueEvent(progress, "change", (p) => setPassed(p >= threshold));
  return passed;
}

export function PinScene({
  children,
  heightVh = 300,
  className = "",
  dividerFill,
  id,
  ariaLabel,
}: {
  children: ReactNode;
  heightVh?: number;
  className?: string;
  /** Color de la cresta separadora que cuelga del borde superior. */
  dividerFill?: string;
  id?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const effectiveVh = useSceneHeightVh(heightVh);
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
      style={{ height: `${effectiveVh}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <SceneCtx.Provider value={scrollYProgress}>{children}</SceneCtx.Provider>
      </div>
      {dividerFill && <SectionDivider fill={dividerFill} />}
    </section>
  );
}

export type ShotEdge = "left" | "right" | "top" | "bottom" | "zoom" | "none";

const EASE = cubicBezier(...EASE_OUT);
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

// El desplazamiento es de un solo lado (viento): más escala para compensar.
const SAND_SCALE = 160;

/**
 * Plano de una PinScene: visible mientras el progreso está en [from, to].
 * Al cruzar un umbral, la entrada/salida se reproduce ENTERA en el tiempo
 * (no ligada al scroll): aunque el usuario pare o vaya rápido, la animación
 * siempre se completa. El contenido se compone/descompone en arena (filtro
 * SVG de desplazamiento por ruido); desactivable con sand={false}.
 * Posiciónalo solo con inset/flex en className: x/y/scale los pilota el plano.
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
  const filterNodesRef = useRef<{
    disp: Element | null;
    lastScale: number;
  } | null>(null);
  const reduced = useReducedMotion();

  const opacity = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  /** 0 = arena suelta · 1 = texto compuesto. */
  const compose = useMotionValue(0);
  const activeRef = useRef<boolean | null>(null);
  const controlsRef = useRef<AnimationPlaybackControls[]>([]);

  const visibility = useTransform(opacity, (v) =>
    v <= 0.001 ? "hidden" : "visible",
  );

  // La arena sigue a la animación de composición. El filtro se aplica a los
  // hijos de contenido (no al plano entero) para acotar el área a repintar.
  useMotionValueEvent(compose, "change", (v) => {
    if (!sand || reduced) return;
    const outer = outerRef.current;
    if (!outer) return;
    const nodes = (filterNodesRef.current ??= {
      disp: outer.querySelector("feDisplacementMap"),
      lastScale: -1,
    });
    const granular = v > 0.001 && v < 0.999;
    if (granular) {
      // Escala cuantizada: menos invalidaciones del filtro = fluidez.
      const scale = Math.round(((1 - v) * SAND_SCALE) / 6) * 6;
      if (scale !== nodes.lastScale) {
        nodes.lastScale = scale;
        nodes.disp?.setAttribute("scale", String(scale));
      }
    }
    for (const child of outer.children) {
      if (!(child instanceof HTMLElement)) continue;
      child.style.filter = granular ? `url(#${filterId})` : "none";
    }
  });

  // La escena tiene que asomar en pantalla antes de reproducir nada: los
  // planos de apertura (from=0) estrenan su entrada cuando el usuario llega,
  // no de forma invisible al montar.
  const seen = useInView(outerRef, { once: true, amount: 0.2 });

  useEffect(() => {
    const edgeFor = (p: number) => {
      const edge = p < (from + to) / 2 ? enter : exit;
      return { edge, off: edgeOffset(edge, edge === exit) };
    };

    if (!seen) {
      if (activeRef.current === null) {
        // Oculto, colocado en su lado de entrada, a la espera de asomar.
        const { off } = edgeFor(progress.get());
        opacity.set(0);
        x.set(off.x);
        y.set(off.y);
        scale.set(off.scale);
        compose.set(0);
      }
      return;
    }

    const apply = (p: number) => {
      const inRange = p >= from && p <= to;
      if (inRange === activeRef.current) return;
      activeRef.current = inRange;

      // Lado del borde cruzado: entrando/saliendo por el inicio del rango se
      // usa el lado de entrada; por el final, el de salida.
      const { edge, off } = edgeFor(p);

      // El viento sopla del lado por el que se mueve el plano.
      outerRef.current
        ?.querySelector("feFuncR")
        ?.setAttribute("intercept", edge === "right" ? "0" : "0.5");

      controlsRef.current.forEach((c) => c.stop());

      if (reduced) {
        opacity.set(inRange ? 1 : 0);
        x.set(inRange ? 0 : off.x);
        y.set(inRange ? 0 : off.y);
        scale.set(inRange ? 1 : off.scale);
        compose.set(inRange ? 1 : 0);
        return;
      }

      const t = { duration: inRange ? 0.9 : 0.65, ease: EASE };
      if (inRange && opacity.get() <= 0.01) {
        // Parte del lado por el que entra.
        x.set(off.x);
        y.set(off.y);
        scale.set(off.scale);
      }
      controlsRef.current = [
        animate(opacity, inRange ? 1 : 0, t),
        animate(x, inRange ? 0 : off.x, t),
        animate(y, inRange ? 0 : off.y, t),
        animate(scale, inRange ? 1 : off.scale, t),
        animate(compose, inRange ? 1 : 0, t),
      ];
    };

    apply(progress.get());
    const unsubscribe = progress.on("change", apply);
    return () => {
      unsubscribe();
      controlsRef.current.forEach((c) => c.stop());
    };
  }, [seen, from, to, enter, exit, reduced, progress, opacity, x, y, scale, compose]);

  return (
    <motion.div
      ref={outerRef}
      style={{ opacity, x, y, scale, visibility }}
      className={`absolute will-change-transform ${className}`}
    >
      {sand && <SandFilter id={filterId} />}
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
