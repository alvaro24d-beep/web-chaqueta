"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Sección de scrollytelling: un contenedor alto con un lienzo pegajoso (sticky)
 * que reproduce una secuencia de fotogramas en función del progreso de scroll.
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

type StepDir = "up" | "left" | "right" | "zoom";

type StepMeta = {
  el: HTMLElement;
  from: number;
  to: number;
  dir: StepDir;
};

const BG = "#0c0e09";

function createLoader(urls: string[], onLoad: (i: number) => void) {
  const imgs: (HTMLImageElement | null)[] = new Array(urls.length).fill(null);
  let started = false;

  function start() {
    if (started) return;
    started = true;
    // Primero el fotograma 0, luego una pasada gruesa (1 de cada 6) para tener
    // cobertura temprana en toda la línea de tiempo, y por último el resto.
    const order: number[] = [0];
    for (let i = 6; i < urls.length; i += 6) order.push(i);
    for (let i = 0; i < urls.length; i++) if (i % 6 !== 0) order.push(i);

    let cursor = 0;
    const CONCURRENCY = 10;
    const next = () => {
      if (cursor >= order.length) return;
      const idx = order[cursor++];
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        imgs[idx] = img;
        onLoad(idx);
        next();
      };
      img.onerror = () => next();
      img.src = urls[idx];
    };
    for (let k = 0; k < CONCURRENCY; k++) next();
  }

  function nearest(i: number): HTMLImageElement | null {
    if (imgs[i]) return imgs[i];
    for (let d = 1; d < urls.length; d++) {
      const lo = i - d;
      const hi = i + d;
      if (lo >= 0 && imgs[lo]) return imgs[lo];
      if (hi < urls.length && imgs[hi]) return imgs[hi];
    }
    return null;
  }

  return { start, nearest };
}

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

    const desiredFrame = () =>
      Math.min(n - 1, Math.max(0, Math.round(frameProgress * (n - 1))));

    const draw = (force = false) => {
      const img = loader.nearest(desiredFrame());
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

    const loader = createLoader(frames, (i) => {
      // Repinta en cuanto llega el fotograma deseado (o el primero disponible).
      if (lastImg === null || i === desiredFrame()) draw(true);
    });

    const steps: StepMeta[] = Array.from(
      sticky.querySelectorAll<HTMLElement>("[data-from]"),
    ).map((el) => ({
      el,
      from: parseFloat(el.dataset.from ?? "0"),
      to: parseFloat(el.dataset.to ?? "1"),
      dir: (el.dataset.dir ?? "up") as StepDir,
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

    // Precarga cuando la sección se acerca (1.5 pantallas de margen).
    const ioLoad = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loader.start();
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
  dir?: "up" | "left" | "right" | "zoom";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-from={from}
      data-to={to}
      data-dir={dir}
      style={{ opacity: 0, visibility: "hidden" }}
      className={`absolute will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
