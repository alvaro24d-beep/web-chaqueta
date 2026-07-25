"use client";

import { useInView } from "framer-motion";
import {
  cloneElement,
  Fragment,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { usePageReady } from "@/lib/frameStore";

/**
 * Smoky Text (Originkit) portado tal cual: cada carácter vuela girado y
 * sesgado desde abajo-izquierda (o arriba-izquierda) renderizado como pila de
 * text-shadow sobre glifo transparente; la pila se infla hasta la humareda al
 * 40 % del recorrido y condensa nítida en su sitio. Mismas keyframes, misma
 * intensidad 1–20 (blur, capas de sombra, distancia de vuelo), mismos tiempos
 * (el escalonado llena la primera mitad de la duración y cada carácter anima
 * la otra mitad; inPlace = todos a la vez con la duración completa) y mismo
 * easing por defecto (easeOut CSS).
 *
 * Diferencias deliberadas con el original:
 * - El color del humo no es un prop: las keyframes usan var(--smoke-c), que
 *   globals.css liga al color real de cada token de texto (bone, ember,
 *   olive, coal…) — cada palabra ahúma en su propio color con un único set
 *   de keyframes por intensidad.
 * - Acepta JSX arbitrario: recorre el árbol y ahúma solo los nodos de texto.
 *   Al terminar (fase visible) se restaura el render original — vuelven los
 *   trazos outline, los hovers y la selección.
 * - Disparadores de la casa: viewport, tras el Preloader (usePageReady) o
 *   controlado con `on` (SmokeGate) desde los pasos de scroll, que además
 *   añade una salida por fundido (el original no tiene salida).
 */

type Phase = "hidden" | "appearing" | "visible" | "exiting";
export type SmokePosition = "bottomLeft" | "topLeft";
export type SmokeMode = "singleLine" | "inPlace";

/** easeOut del original (no el EASE_OUT de la casa: fidelidad primero). */
const EASE_CSS = "cubic-bezier(0,0,0.58,1)";
/** Paso de escalonado bruto por carácter del original (se reescala luego). */
const STAGGER = 0.1;

/**
 * Keyframes del original parametrizadas por intensidad: 1 = soplo nítido y
 * corto · 20 = humareda densa que llega de lejos. El color va en
 * var(--smoke-c) para heredar el del texto.
 */
function kfFor(level: number): string {
  const n = (level - 1) / 19;
  const r = (v: number) => +v.toFixed(2);
  const peakB = Math.round(6 + n * 200);
  const initB = Math.round(2 + n * 70);
  const layers = 1 + Math.round(n * 3);
  const stack = (blur: number) =>
    Array.from(
      { length: layers },
      (_, i) => `0 0 ${Math.round((blur * (i + 1)) / layers)}px var(--smoke-c)`,
    ).join(",");
  const peak = stack(peakB);
  const init = stack(initB);
  const d = 0.7 + n * 0.8;
  const ic = r(1.3 + n * 0.5);
  const ic2 = r(1.15 + n * 0.35);
  const p = `smt${level}`;
  return `
@keyframes ${p}-c-a{from{opacity:0;text-shadow:${init};transform:scale(${ic})}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 var(--smoke-c);transform:none}}
@keyframes ${p}-c-b{from{opacity:0;text-shadow:${init};transform:scale(${ic2})}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 var(--smoke-c);transform:none}}
@keyframes ${p}-bl-a{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-15 * d)}rem,${r(8 * d)}rem,0) rotate(40deg) skewX(-70deg) scale(0.7)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 var(--smoke-c);transform:none}}
@keyframes ${p}-bl-b{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-18 * d)}rem,${r(8 * d)}rem,0) rotate(40deg) skewX(70deg) scale(0.5)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 var(--smoke-c);transform:none}}
@keyframes ${p}-tl-a{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-15 * d)}rem,${r(-8 * d)}rem,0) rotate(-40deg) skewX(70deg) scale(0.7)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 var(--smoke-c);transform:none}}
@keyframes ${p}-tl-b{from{opacity:0;text-shadow:${init};transform:translate3d(${r(-18 * d)}rem,${r(-8 * d)}rem,0) rotate(-40deg) skewX(-70deg) scale(0.5)}40%{text-shadow:${peak}}to{opacity:1;text-shadow:0 0 0 var(--smoke-c);transform:none}}
`;
}

let styleEl: HTMLStyleElement | null = null;
const injectedLevels = new Set<number>();

function ensureKeyframes(level: number) {
  if (typeof document === "undefined" || injectedLevels.has(level)) return;
  injectedLevels.add(level);
  if (!styleEl) {
    styleEl = document.createElement("style");
    document.head.appendChild(styleEl);
  }
  styleEl.textContent += kfFor(level);
}

/** Total de caracteres animables (los espacios cuentan, como el original). */
function countChars(node: ReactNode): number {
  if (node == null || typeof node === "boolean") return 0;
  if (typeof node === "string" || typeof node === "number") {
    return String(node).length;
  }
  if (Array.isArray(node)) return node.reduce((n, c) => n + countChars(c), 0);
  if (isValidElement(node)) {
    return countChars((node.props as { children?: ReactNode }).children);
  }
  return 0;
}

type WalkCtx = {
  phase: Phase;
  position: SmokePosition;
  mode: SmokeMode;
  level: number;
  charDur: number;
  step: number;
  idx: number;
  key: number;
};

function renderText(text: string, ctx: WalkCtx): ReactNode {
  const segs = text.match(/\S+|\s+/g) ?? [];
  return segs.map((seg) => {
    if (/^\s/.test(seg)) {
      // Los espacios no se animan pero consumen índices (como el original).
      ctx.idx += seg.length;
      return (
        <span key={ctx.key++} style={{ whiteSpace: "pre" }}>
          {seg}
        </span>
      );
    }
    return (
      <span
        key={ctx.key++}
        style={{ display: "inline-block", whiteSpace: "nowrap" }}
      >
        {seg.split("").map((char) => {
          const i = ctx.idx++;
          const style: CSSProperties = {
            display: "inline-block",
            color: "transparent",
          };
          if (ctx.phase === "hidden") style.opacity = 0;
          if (ctx.phase === "appearing") {
            const variant =
              ctx.mode === "inPlace"
                ? "c"
                : ctx.position === "topLeft"
                  ? "tl"
                  : "bl";
            const name = `smt${ctx.level}-${variant}-${i % 2 === 0 ? "a" : "b"}`;
            style.animation = `${name} ${ctx.charDur}s ${(i * ctx.step).toFixed(3)}s ${EASE_CSS} both`;
          }
          return (
            <span key={ctx.key++} style={style}>
              {char}
            </span>
          );
        })}
      </span>
    );
  });
}

function walk(node: ReactNode, ctx: WalkCtx): ReactNode {
  if (node == null || typeof node === "boolean") return node;
  if (typeof node === "string" || typeof node === "number") {
    return renderText(String(node), ctx);
  }
  if (Array.isArray(node)) {
    return node.map((child) => (
      <Fragment key={ctx.key++}>{walk(child, ctx)}</Fragment>
    ));
  }
  if (isValidElement(node)) {
    const children = (node.props as { children?: ReactNode }).children;
    if (children == null) return node;
    return cloneElement(node, undefined, walk(children, ctx));
  }
  return node;
}

type SmokeVisualProps = {
  children: ReactNode;
  /** Duración total (escalonado incluido), como el original. */
  duration?: number;
  /** 1 = soplo nítido y corto · 20 = humareda densa que llega de lejos. */
  intensity?: number;
  /** Lado desde el que vuelan los caracteres. */
  position?: SmokePosition;
  /** singleLine = escalonado secuencial · inPlace = todos a la vez. */
  animationMode?: SmokeMode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "style">;

/** Render puro por fases. En visible/exiting devuelve el JSX original. */
function SmokeChars({
  children,
  phase,
  duration = 2,
  intensity = 10,
  position = "bottomLeft",
  animationMode = "singleLine",
  className = "",
  style,
  ref,
  ...rest
}: SmokeVisualProps & { phase: Phase }) {
  const level = Math.round(Math.min(20, Math.max(1, intensity)));
  useEffect(() => {
    ensureKeyframes(level);
  }, [level]);

  // Reparto del original: el escalonado llena la primera mitad de la duración
  // y cada carácter anima la otra mitad. inPlace: todos a la vez, entera.
  const total = countChars(children);
  const maxRaw = animationMode === "inPlace" ? 0 : (total - 1) * STAGGER;
  const charDur = maxRaw > 0 ? duration * 0.5 : duration;
  const step = maxRaw > 0 ? (duration * 0.5) / (total - 1) : 0;
  const ctx: WalkCtx = {
    phase,
    position,
    mode: animationMode,
    level,
    charDur,
    step,
    idx: 0,
    key: 0,
  };
  const smoky = phase === "hidden" || phase === "appearing";

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: phase === "hidden" || phase === "exiting" ? 0 : 1,
        visibility: phase === "hidden" ? "hidden" : "visible",
        transition: "opacity 0.4s ease-out",
      }}
      {...rest}
    >
      {smoky ? walk(children, ctx) : children}
    </div>
  );
}

/**
 * Humo controlado por un booleano: cada vez que `on` pasa a true la entrada
 * se reproduce ENTERA desde cero; al pasar a false, salida por fundido y
 * vuelta a hidden (lista para reestrenarse). Es la pieza que usan los pasos
 * de scroll (SeqStep, Shot).
 */
export function SmokeGate({
  on,
  delay = 0,
  duration = 2,
  ...rest
}: SmokeVisualProps & { on: boolean; delay?: number }) {
  const [phase, setPhase] = useState<Phase>("hidden");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    clear();
    if (on) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        timers.current.push(setTimeout(() => setPhase("visible"), 0));
        return clear;
      }
      // Pasar SIEMPRE por hidden: quita la animación CSS del DOM para que la
      // siguiente fase la reestrene (reasignar el mismo valor no reinicia).
      timers.current.push(setTimeout(() => setPhase("hidden"), 0));
      timers.current.push(
        setTimeout(
          () => {
            setPhase("appearing");
            timers.current.push(
              setTimeout(() => setPhase("visible"), duration * 1000 + 200),
            );
          },
          Math.max(delay * 1000, 80),
        ),
      );
    } else {
      timers.current.push(
        setTimeout(() => setPhase((p) => (p === "hidden" ? p : "exiting")), 0),
      );
      timers.current.push(setTimeout(() => setPhase("hidden"), 420));
    }
    return clear;
  }, [on, delay, duration]);

  return <SmokeChars phase={phase} duration={duration} {...rest} />;
}

/**
 * Humo autodisparado (una sola vez): al entrar en viewport (mode="view"),
 * al soltar el Preloader la página (mode="mount") o cuando `when` lo permita.
 */
export default function SmokeText({
  mode = "view",
  when = true,
  ...rest
}: SmokeVisualProps & {
  mode?: "view" | "mount";
  delay?: number;
  /** Condición extra para disparar (p. ej. el footer telón ya revelado). */
  when?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const ready = usePageReady();
  const inView = useInView(ref, {
    once: true,
    amount: 0.3,
    margin: "0px 0px -8% 0px",
  });
  const on = (mode === "mount" ? ready : inView) && when;

  return <SmokeGate ref={ref} on={on} {...rest} />;
}
