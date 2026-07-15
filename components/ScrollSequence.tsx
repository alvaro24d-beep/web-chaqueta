"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import SectionDivider from "@/components/SectionDivider";
import SandFilter from "@/components/motion/SandFilter";
import { getFrame, onFrameLoad, preloadSequences } from "@/lib/frameStore";
import { useSceneHeightVh } from "@/lib/useSceneHeight";

/**
 * Sección de scrollytelling: un contenedor alto con un lienzo pegajoso (sticky)
 * que reproduce una secuencia de fotogramas en función del progreso de scroll.
 * Los fotogramas salen de la caché global (lib/frameStore) que el Preloader
 * llena al arrancar: reproducción siempre a fotograma exacto.
 *
 * Los hijos con data-from / data-to son "pasos" superpuestos que el bucle de
 * animación funde y desplaza según el progreso (ver <SeqStep />). No uses
 * utilidades de transform de Tailwind en el elemento del paso: el bucle
 * escribe style.transform directamente — posiciona con inset + flex.
 */

type ScrollSequenceProps = {
  frames: string[];
  /** Altura total de la sección en vh (cuanto más alta, más lenta la reproducción). */
  heightVh?: number;
  /** Punto focal horizontal 0..1 para el recorte tipo cover (0.5 = centrado). */
  focusX?: number;
  /** Color de la cresta separadora que cuelga del borde superior. */
  dividerFill?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
  children?: ReactNode;
};

type StepMeta = {
  el: HTMLElement;
  from: number;
  to: number;
  dir: StepDir;
  /** Nodos del filtro de arena del paso (si los tiene). */
  disp: SVGFEDisplacementMapElement | null;
  funcR: SVGFEFuncRElement | null;
  lastScale: number;
  filterId: string;
  /** Hijos de contenido a los que se aplica el filtro (excluye el svg). */
  targets: HTMLElement[];
  /** Animación temporal 0..1 (las entradas/salidas se reproducen enteras). */
  anim: number;
  target: number;
  vec: { x: number; y: number; s: number };
};

type StepDir = "up" | "left" | "right" | "zoom";

const BG = "#0c0e09";
// El desplazamiento es de un solo lado (viento): más escala para compensar.
const SAND_SCALE = 170;
const ENTER_MS = 850;
const EXIT_MS = 600;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Offset del paso en el borde de entrada ("start") o de salida ("end"). */
const vecFor = (dir: StepDir, edge: "start" | "end") => {
  if (dir === "left") return { x: edge === "start" ? -110 : 110, y: 0, s: 1 };
  if (dir === "right") return { x: edge === "start" ? 110 : -110, y: 0, s: 1 };
  if (dir === "zoom")
    return { x: 0, y: 0, s: edge === "start" ? 0.86 : 1.09 };
  return { x: 0, y: edge === "start" ? 32 : -32, s: 1 };
};

export default function ScrollSequence({
  frames,
  heightVh = 400,
  focusX = 0.5,
  dividerFill,
  id,
  className = "",
  ariaLabel,
  children,
}: ScrollSequenceProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const effectiveVh = useSceneHeightVh(heightVh);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    if (!section || !sticky || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const n = frames.length;
    let width = 0;
    let height = 0;
    let progress = 0;
    let frameProgress = 0;
    let preRoll = 0;
    let lastImg: HTMLImageElement | null = null;
    let raf = 0;
    let active = false;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const desiredFrame = () =>
      Math.min(n - 1, Math.max(0, Math.round(frameProgress * (n - 1))));

    const nearest = (i: number): HTMLImageElement | null => {
      const exact = getFrame(frames[i]);
      if (exact) return exact;
      for (let d = 1; d < n; d++) {
        const lo = i - d;
        const hi = i + d;
        if (lo >= 0) {
          const img = getFrame(frames[lo]);
          if (img) return img;
        }
        if (hi < n) {
          const img = getFrame(frames[hi]);
          if (img) return img;
        }
      }
      return null;
    };

    const draw = (force = false) => {
      const img = nearest(desiredFrame());
      if (!img || (!force && img === lastImg)) return;
      lastImg = img;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const s = Math.max(width / iw, height / ih);
      const dw = iw * s;
      const dh = ih * s;
      ctx.drawImage(img, (width - dw) * focusX, (height - dh) * 0.5, dw, dh);
    };

    // Repinta cuando llegan fotogramas nuevos de la caché global.
    const unsubscribe = onFrameLoad(() => draw(lastImg === null));

    const steps: StepMeta[] = Array.from(
      sticky.querySelectorAll<HTMLElement>("[data-from]"),
    ).map((el) => ({
      el,
      from: parseFloat(el.dataset.from ?? "0"),
      to: parseFloat(el.dataset.to ?? "1"),
      dir: (el.dataset.dir ?? "up") as StepDir,
      disp: el.querySelector<SVGFEDisplacementMapElement>("feDisplacementMap"),
      funcR: el.querySelector<SVGFEFuncRElement>("feFuncR"),
      lastScale: -1,
      filterId: el.dataset.sandId ?? "",
      targets: Array.from(el.children).filter(
        (c): c is HTMLElement => c instanceof HTMLElement,
      ),
      anim: 0,
      target: 0,
      vec: vecFor((el.dataset.dir ?? "up") as StepDir, "start"),
    }));

    // Entradas/salidas disparadas por umbral y reproducidas ENTERAS en el
    // tiempo (no ligadas al progreso): aunque el scroll sea rápido o se pare
    // a mitad, la animación del texto siempre se completa.
    const updateSteps = (dt: number) => {
      for (const s of steps) {
        const inRange = progress >= s.from && progress <= s.to;
        const target = inRange ? 1 : 0;
        if (target !== s.target) {
          s.target = target;
          // Lado por el que entra/sale según el borde del rango cruzado.
          const edge =
            progress < (s.from + s.to) / 2 ? ("start" as const) : ("end" as const);
          s.vec = vecFor(s.dir, edge);
          // El viento sopla del lado por el que se mueve el paso.
          s.funcR?.setAttribute("intercept", s.vec.x > 0 ? "0" : "0.5");
        }
        if (s.anim !== s.target) {
          const dur = s.target === 1 ? ENTER_MS : EXIT_MS;
          s.anim = Math.min(
            1,
            Math.max(0, s.anim + ((s.target === 1 ? 1 : -1) * dt) / dur),
          );
        }
        const e = easeOut(s.anim);
        // Movimiento reducido: solo fundido de opacidad, sin desplazamientos.
        const move = reducedMotion ? 0 : 1 - e;
        const x = s.vec.x * move;
        const y = s.vec.y * move;
        const sc = 1 + (s.vec.s - 1) * move;
        s.el.style.opacity = e.toFixed(3);
        s.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
        s.el.style.visibility = e <= 0.001 ? "hidden" : "visible";

        // Arena al viento: el contenido se disgrega en ráfagas mientras la
        // animación está en curso. Escala cuantizada: menos invalidaciones
        // del filtro = fluidez.
        if (s.disp && !reducedMotion) {
          const granular = e > 0.001 && e < 0.999;
          if (granular) {
            const scale = Math.round(((1 - e) * SAND_SCALE) / 6) * 6;
            if (scale !== s.lastScale) {
              s.lastScale = scale;
              s.disp.setAttribute("scale", String(scale));
            }
          }
          for (const target of s.targets) {
            target.style.filter = granular ? `url(#${s.filterId})` : "none";
          }
        }
      }
    };

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      // Línea de tiempo de los pasos: solo el tramo fijo (sticky).
      progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      // Línea de tiempo de los fotogramas: arranca ya en la aproximación
      // (preRoll px antes del pin) para que el vídeo nunca llegue parado.
      const span = total + preRoll;
      frameProgress =
        span > 0 ? Math.min(1, Math.max(0, (preRoll - rect.top) / span)) : 0;
    };

    let lastT = performance.now();
    const tick = () => {
      if (!active) return;
      const now = performance.now();
      const dt = Math.min(64, now - lastT);
      lastT = now;
      measure();
      draw();
      updateSteps(dt);
      raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = sticky.clientWidth * dpr;
      height = sticky.clientHeight * dpr;
      canvas.width = width;
      canvas.height = height;
      // Aproximación disponible antes del pin: una pantalla, o menos si la
      // sección nace más arriba (el hero, en top 0, no tiene pre-roll).
      const rect = section.getBoundingClientRect();
      preRoll = Math.min(
        window.innerHeight,
        Math.max(0, rect.top + window.scrollY),
      );
      measure();
      draw(true);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(sticky);

    // Refuerzo por si se llega con ancla directa sin pasar por el Preloader.
    const ioLoad = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          preloadSequences([frames]);
          ioLoad.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    ioLoad.observe(section);

    // El bucle rAF solo corre con la sección cerca del viewport.
    const ioActive = new IntersectionObserver(
      (entries) => {
        const isNear = entries.some((e) => e.isIntersecting);
        if (isNear && !active) {
          active = true;
          lastT = performance.now();
          raf = requestAnimationFrame(tick);
        } else if (!isNear && active) {
          active = false;
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "25% 0px" },
    );
    ioActive.observe(section);

    // dt=0: los pasos ya dentro de rango fijan su objetivo pero la animación
    // no avanza hasta que la sección se acerca (el bucle rAF solo corre
    // entonces) — la entrada siempre se reproduce a la vista del usuario.
    resize();
    measure();
    updateSteps(0);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      unsubscribe();
      ro.disconnect();
      ioLoad.disconnect();
      ioActive.disconnect();
    };
  }, [frames, focusX]);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={ariaLabel}
      className={`relative ${className}`}
      style={{ height: `${effectiveVh}vh` }}
    >
      <div ref={stickyRef} className="sticky top-0 h-screen overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full bg-coal"
        />
        {children}
      </div>
      {dividerFill && <SectionDivider fill={dividerFill} />}
    </section>
  );
}

/**
 * Paso superpuesto de una ScrollSequence. Visible mientras el progreso de la
 * sección está dentro de [from, to]. Posiciónalo SOLO con inset/flex en
 * className (nunca con utilidades translate-*: el transform lo pilota JS).
 * `dir` marca la coreografía: "left"/"right" cruzan la pantalla, "zoom"
 * acerca el plano a cámara, "up" es el desplazamiento vertical clásico.
 * El contenido se compone/descompone en arena en las rampas de entrada/salida.
 */
export function SeqStep({
  from,
  to,
  dir = "up",
  className = "",
  children,
}: {
  from: number;
  to: number;
  dir?: StepDir;
  className?: string;
  children: ReactNode;
}) {
  const rawId = useId();
  const filterId = `sand${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div
      data-from={from}
      data-to={to}
      data-dir={dir}
      data-sand-id={filterId}
      style={{ opacity: 0, visibility: "hidden" }}
      className={`absolute will-change-transform ${className}`}
    >
      <SandFilter id={filterId} />
      {children}
    </div>
  );
}
