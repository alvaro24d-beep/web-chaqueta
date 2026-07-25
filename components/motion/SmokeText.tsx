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
  type ReactNode,
} from "react";
import { usePageReady } from "@/lib/frameStore";
import { EASE_OUT } from "@/lib/motion";

/**
 * Entrada "de humo" por caracteres (adaptación del Smoky Text de Originkit):
 * cada letra vuela desde la dirección indicada girada y sesgada, se infla en
 * una nube de desenfoque a mitad de camino y se condensa nítida en su sitio,
 * con escalonado repartido a lo largo de la duración.
 *
 * Diferencias con el original: el humo se hace con filter: blur por carácter
 * (no con text-shadow + color transparente) para conservar los estilos del
 * contenido — colores mixtos, trazos outline, enlaces con hover —, acepta
 * JSX arbitrario (recorre el árbol y ahúma solo los nodos de texto), añade
 * la variante "right" y se dispara con nuestra infraestructura: viewport,
 * tras el Preloader (usePageReady) o condición externa (`when`). Del original
 * se conservan `intensity` (1 = soplo nítido · 20 = humareda densa) y el
 * modo in-place (from="none"): todos los caracteres condensan A LA VEZ desde
 * la nube, sin escalonado. Se descarta el modo multiLine (stagger por línea
 * visual medida en DOM): con JSX arbitrario no hay medida fiable por palabra.
 */

type Phase = "hidden" | "appearing" | "visible";
type From = "left" | "right" | "top" | "none";

const EASE_CSS = `cubic-bezier(${EASE_OUT.join(",")})`;

/**
 * Keyframes parametrizados por intensidad: más intensidad = más blur, vuelo
 * más largo y condensación desde más lejos. En 10 reproduce el look de la
 * casa. Se inyectan bajo demanda en un <style> compartido, una vez por valor.
 */
function kfFor(level: number): string {
  const n = (level - 1) / 19;
  const r = (v: number) => +v.toFixed(2);
  const peak = Math.round(16 + n * 68);
  const init = Math.round(6 + n * 13);
  const d = 0.7 + n * 0.8;
  const x1 = r(10.2 * d);
  const x2 = r(12 * d);
  const y = r(5.6 * d);
  const pInit = Math.round(12 + n * 30);
  const s1 = r(1.3 + n * 0.32);
  const s2 = r(1.15 + n * 0.21);
  const p = `smk${level}`;
  return `
@keyframes ${p}-left-a{from{opacity:0;filter:blur(${init}px);transform:translate3d(-${x1}rem,${y}rem,0) rotate(32deg) skewX(-55deg) scale(0.7)}40%{filter:blur(${peak}px)}to{opacity:1;filter:blur(0px);transform:none}}
@keyframes ${p}-left-b{from{opacity:0;filter:blur(${init}px);transform:translate3d(-${x2}rem,${y}rem,0) rotate(32deg) skewX(55deg) scale(0.5)}40%{filter:blur(${peak}px)}to{opacity:1;filter:blur(0px);transform:none}}
@keyframes ${p}-right-a{from{opacity:0;filter:blur(${init}px);transform:translate3d(${x1}rem,${y}rem,0) rotate(-32deg) skewX(55deg) scale(0.7)}40%{filter:blur(${peak}px)}to{opacity:1;filter:blur(0px);transform:none}}
@keyframes ${p}-right-b{from{opacity:0;filter:blur(${init}px);transform:translate3d(${x2}rem,${y}rem,0) rotate(-32deg) skewX(-55deg) scale(0.5)}40%{filter:blur(${peak}px)}to{opacity:1;filter:blur(0px);transform:none}}
@keyframes ${p}-top-a{from{opacity:0;filter:blur(${init}px);transform:translate3d(-${x1}rem,-${y}rem,0) rotate(-32deg) skewX(55deg) scale(0.7)}40%{filter:blur(${peak}px)}to{opacity:1;filter:blur(0px);transform:none}}
@keyframes ${p}-top-b{from{opacity:0;filter:blur(${init}px);transform:translate3d(-${x2}rem,-${y}rem,0) rotate(-32deg) skewX(-55deg) scale(0.5)}40%{filter:blur(${peak}px)}to{opacity:1;filter:blur(0px);transform:none}}
@keyframes ${p}-place-a{from{opacity:0;filter:blur(${pInit}px);transform:scale(${s1})}40%{filter:blur(${peak}px)}to{opacity:1;filter:blur(0px);transform:none}}
@keyframes ${p}-place-b{from{opacity:0;filter:blur(${pInit}px);transform:scale(${s2})}40%{filter:blur(${peak}px)}to{opacity:1;filter:blur(0px);transform:none}}
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

function countChars(node: ReactNode): number {
  if (node == null || typeof node === "boolean") return 0;
  if (typeof node === "string" || typeof node === "number") {
    return String(node).replace(/\s+/g, "").length;
  }
  if (Array.isArray(node)) return node.reduce((n, c) => n + countChars(c), 0);
  if (isValidElement(node)) {
    return countChars((node.props as { children?: ReactNode }).children);
  }
  return 0;
}

type WalkCtx = {
  phase: Phase;
  from: From;
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
          const style: CSSProperties = { display: "inline-block" };
          if (ctx.phase === "hidden") style.opacity = 0;
          if (ctx.phase === "appearing") {
            const variant = ctx.from === "none" ? "place" : ctx.from;
            const name = `smk${ctx.level}-${variant}-${i % 2 === 0 ? "a" : "b"}`;
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

export default function SmokeText({
  children,
  className = "",
  innerClassName = "",
  from = "left",
  mode = "view",
  delay = 0,
  duration = 1.4,
  intensity = 10,
  when = true,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  from?: From;
  mode?: "view" | "mount";
  delay?: number;
  duration?: number;
  /** 1 = soplo nítido y corto · 20 = humareda densa que llega de lejos. */
  intensity?: number;
  /** Condición extra para disparar (p. ej. el footer telón ya revelado). */
  when?: boolean;
}) {
  const level = Math.round(Math.min(20, Math.max(1, intensity)));
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("hidden");
  const ready = usePageReady();
  const inView = useInView(outerRef, {
    once: true,
    amount: 0.3,
    margin: "0px 0px -8% 0px",
  });
  const trigger = (mode === "mount" ? ready : inView) && when;

  useEffect(() => {
    ensureKeyframes(level);
  }, [level]);

  useEffect(() => {
    if (!trigger || phase !== "hidden") return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setPhase("visible");
      return;
    }
    const timers = [
      setTimeout(
        () => {
          setPhase("appearing");
          timers.push(
            setTimeout(() => setPhase("visible"), duration * 1000 + 200),
          );
        },
        Math.max(delay * 1000, 80),
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, [trigger, phase, delay, duration]);

  // Escalonado: las letras se reparten en la primera mitad de la duración y
  // cada una anima durante la otra mitad (como el original). En in-place
  // (from="none") no hay escalonado: la nube entera condensa a la vez.
  const total = countChars(children);
  const simultaneous = from === "none";
  const charDur = simultaneous ? duration : duration * 0.5;
  const step =
    !simultaneous && total > 1 ? (duration * 0.5) / (total - 1) : 0;
  const ctx: WalkCtx = { phase, from, level, charDur, step, idx: 0, key: 0 };

  return (
    <div ref={outerRef} className={className}>
      <div
        className={innerClassName}
        style={{
          opacity: phase === "hidden" ? 0 : 1,
          transition: "opacity 0.3s ease-out",
        }}
      >
        {walk(children, ctx)}
      </div>
    </div>
  );
}
