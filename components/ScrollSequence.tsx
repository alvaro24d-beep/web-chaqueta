"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import SectionDivider from "@/components/SectionDivider";
import { SmokeGate, type SmokeMode, type SmokePosition } from "@/components/motion/SmokeText";
import { getFrame, isPageReady, onFrameLoad, preloadSequences } from "@/lib/frameStore";
import { useSceneHeightVh } from "@/lib/useSceneHeight";

/**
 * Sección de scrollytelling: un contenedor alto con un lienzo pegajoso (sticky)
 * que reproduce una secuencia de fotogramas en función del progreso de scroll.
 * Los fotogramas salen de la caché global (lib/frameStore) que el Preloader
 * llena al arrancar: reproducción siempre a fotograma exacto.
 *
 * Los hijos con data-from / data-to son "pasos" superpuestos (ver <SeqStep />):
 * el bucle rAF calcula si el progreso está dentro de su rango y les avisa por
 * CustomEvent; el texto del paso entra con el humo de SmokeText (Originkit) y
 * sale por fundido. Las entradas esperan a que el Preloader suelte la página.
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
  on: boolean;
};

const BG = "#0c0e09";

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
      on: false,
    }));

    // Cada paso recibe su encendido/apagado por evento; SmokeGate reproduce
    // la entrada de humo ENTERA (no ligada al scroll) y la salida por fundido.
    // Nada se estrena bajo el Preloader: se espera a isPageReady().
    const updateSteps = () => {
      const ready = isPageReady();
      for (const s of steps) {
        const on = ready && progress >= s.from && progress <= s.to;
        if (on !== s.on) {
          s.on = on;
          s.el.dispatchEvent(new CustomEvent("smoke", { detail: { on } }));
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

    const tick = () => {
      if (!active) return;
      measure();
      draw();
      updateSteps();
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

    // El bucle rAF solo corre con la sección cerca del viewport: los pasos
    // estrenan su entrada a la vista del usuario, nunca fuera de pantalla.
    const ioActive = new IntersectionObserver(
      (entries) => {
        const isNear = entries.some((e) => e.isIntersecting);
        if (isNear && !active) {
          active = true;
          raf = requestAnimationFrame(tick);
        } else if (!isNear && active) {
          active = false;
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "25% 0px" },
    );
    ioActive.observe(section);

    resize();
    measure();
    updateSteps();

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
          data-seq-canvas
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
 * Paso superpuesto de una ScrollSequence: visible mientras el progreso de la
 * sección está dentro de [from, to]. El texto entra con el humo del Smoky
 * Text (por defecto: vuelo desde abajo-izquierda con escalonado secuencial)
 * y sale por fundido. Posiciónalo con inset/flex en className.
 */
export function SeqStep({
  from,
  to,
  className = "",
  children,
  duration,
  intensity,
  position,
  animationMode,
}: {
  from: number;
  to: number;
  className?: string;
  children: ReactNode;
  duration?: number;
  intensity?: number;
  position?: SmokePosition;
  animationMode?: SmokeMode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) =>
      setOn(Boolean((e as CustomEvent<{ on: boolean }>).detail?.on));
    el.addEventListener("smoke", handler);
    return () => el.removeEventListener("smoke", handler);
  }, []);

  return (
    <SmokeGate
      ref={ref}
      on={on}
      data-from={from}
      data-to={to}
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
