"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { getFrame, onFrameLoad, preloadSequences } from "@/lib/frameStore";

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
  /** Nodo feDisplacementMap del filtro de arena del paso (si lo tiene). */
  disp: SVGFEDisplacementMapElement | null;
  filterId: string;
  /** Hijos de contenido a los que se aplica el filtro (excluye el svg). */
  targets: HTMLElement[];
};

type StepDir = "up" | "left" | "right" | "zoom";

const BG = "#0c0e09";
const SAND_SCALE = 130;

const smooth = (t: number) => t * t * (3 - 2 * t);

export default function ScrollSequence({
  frames,
  heightVh = 400,
  focusX = 0.5,
  id,
  className = "",
  ariaLabel,
  children,
}: ScrollSequenceProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      filterId: el.dataset.sandId ?? "",
      targets: Array.from(el.children).filter(
        (c): c is HTMLElement => c instanceof HTMLElement,
      ),
    }));

    const updateSteps = () => {
      for (const s of steps) {
        const t = (progress - s.from) / (s.to - s.from);
        let opacity = 0;
        let x = 0;
        let y = 0;
        let sc = 1;
        if (t >= 0 && t <= 1) {
          // Rampas de entrada/salida en el 25% de cada extremo del rango.
          // Los pasos anclados al inicio (from<=0) o al final (to>=1) de la
          // sección no se funden en ese borde: aparecen/permanecen fijos.
          const rampIn = s.from <= 0.001 ? 1 : Math.min(1, t / 0.25);
          const rampOut = s.to >= 0.999 ? 1 : Math.min(1, (1 - t) / 0.25);
          opacity = smooth(Math.min(rampIn, rampOut));
          const inD = 1 - rampIn;
          const outD = 1 - rampOut;
          // "left"/"right" cruzan la pantalla (entran por un lado y salen por
          // el contrario); "zoom" viene de lejos y sale hacia cámara.
          if (s.dir === "left") x = -inD * 110 + outD * 110;
          else if (s.dir === "right") x = inD * 110 - outD * 110;
          else if (s.dir === "zoom") sc = 1 - inD * 0.14 + outD * 0.09;
          else y = inD * 32 - outD * 32;
        } else {
          if (s.dir === "left") x = t < 0 ? -110 : 110;
          else if (s.dir === "right") x = t < 0 ? 110 : -110;
          else if (s.dir === "zoom") sc = t < 0 ? 0.86 : 1.09;
          else y = t < 0 ? 32 : -32;
        }
        s.el.style.opacity = opacity.toFixed(3);
        s.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
        s.el.style.visibility = opacity === 0 ? "hidden" : "visible";

        // Arena: el contenido se disgrega en granos en las rampas de
        // entrada/salida (filtro SVG de desplazamiento por ruido).
        if (s.disp && !reducedMotion) {
          const granular = opacity > 0.001 && opacity < 0.999;
          if (granular) {
            s.disp.setAttribute(
              "scale",
              ((1 - opacity) * SAND_SCALE).toFixed(1),
            );
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

    // El bucle rAF solo corre con la sección cerca del viewport.
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
      style={{ height: `${heightVh}vh` }}
    >
      <div ref={stickyRef} className="sticky top-0 h-screen overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full bg-coal"
        />
        {children}
      </div>
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
            in="SourceGraphic"
            in2="n"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      {children}
    </div>
  );
}
