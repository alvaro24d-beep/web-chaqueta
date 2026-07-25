"use client";

import {
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import SectionDivider from "@/components/SectionDivider";
import { SmokeGate, type SmokeMode, type SmokePosition } from "@/components/motion/SmokeText";
import { useSceneHeightVh } from "@/lib/useSceneHeight";

/**
 * Escena cinematográfica fijada: una sección alta con un contenedor sticky a
 * pantalla completa cuyo contenido se "reproduce" con el scroll (scrubbing).
 * Los hijos <Shot> son planos con un rango [from, to] del progreso: su texto
 * entra con el humo de SmokeText (Originkit) y sale por fundido.
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

/**
 * Plano de una PinScene: visible mientras el progreso está en [from, to].
 * Al entrar en rango, el texto se reproduce ENTERO con el humo del Smoky
 * Text (no ligado al scroll: aunque el usuario pare o vaya rápido, la
 * animación siempre se completa); al salir, fundido. La escena tiene que
 * asomar en pantalla antes de estrenar nada (los planos de apertura no se
 * reproducen invisibles al montar). Posiciónalo con inset/flex en className.
 */
export function Shot({
  children,
  from,
  to,
  className = "",
  duration,
  intensity,
  position,
  animationMode,
}: {
  children: ReactNode;
  from: number;
  to: number;
  className?: string;
  duration?: number;
  intensity?: number;
  position?: SmokePosition;
  animationMode?: SmokeMode;
}) {
  const progress = useSceneProgress();
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  const seen = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (!seen) return;
    const apply = (p: number) => setOn(p >= from && p <= to);
    apply(progress.get());
    return progress.on("change", apply);
  }, [seen, from, to, progress]);

  return (
    <SmokeGate
      ref={ref}
      on={on}
      duration={duration}
      intensity={intensity}
      position={position}
      animationMode={animationMode}
      className={`absolute ${className}`}
    >
      {children}
    </SmokeGate>
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
