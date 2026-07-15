"use client";

import {
  animate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useId, useRef, type ReactNode } from "react";
import SandFilter from "@/components/motion/SandFilter";
import { usePageReady } from "@/lib/frameStore";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type FilterNodes = {
  disp: Element | null;
  lastScale: number;
};

/** Cuantiza la escala: menos invalidaciones del filtro = animación fluida. */
const SCALE_STEP = 6;

/**
 * Entrada "de arena al viento": el contenido llega como una ráfaga de granos
 * desde la dirección indicada y se asienta progresivamente hasta formar el
 * texto nítido. mode="mount" espera a que el Preloader suelte la página;
 * mode="view" dispara al entrar en el viewport.
 */
export default function SandText({
  children,
  className = "",
  innerClassName = "",
  from = "left",
  mode = "view",
  delay = 0,
  duration = 1.2,
  distance = 90,
  grain = 170,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  from?: "left" | "right" | "top" | "none";
  mode?: "view" | "mount";
  delay?: number;
  duration?: number;
  distance?: number;
  grain?: number;
}) {
  const rawId = useId();
  const filterId = `sand${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const outerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<FilterNodes | null>(null);
  const p = useMotionValue(0);
  const reduced = useReducedMotion();
  const ready = usePageReady();

  // El viento sopla desde un único lado: derecha solo si el texto viene de
  // la derecha; en el resto de casos, desde la izquierda.
  const windRight = from === "right";

  const inView = useInView(outerRef, {
    once: true,
    amount: 0.3,
    margin: "0px 0px -8% 0px",
  });
  const trigger = mode === "mount" ? ready : inView;

  useEffect(() => {
    outerRef.current
      ?.querySelector("feFuncR")
      ?.setAttribute("intercept", windRight ? "0" : "0.5");
  }, [windRight]);

  useEffect(() => {
    if (!trigger) return;
    const controls = animate(p, 1, {
      duration: reduced ? 0 : duration,
      delay,
      ease: EASE,
    });
    return () => controls.stop();
  }, [trigger, delay, duration, reduced, p]);

  useMotionValueEvent(p, "change", (v) => {
    const el = contentRef.current;
    if (!el) return;
    el.style.opacity = String(Math.min(1, v * 1.8));
    const off = (1 - v) * distance;
    const x = from === "left" ? -off : from === "right" ? off : 0;
    const y = from === "top" ? -off : 0;
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    if (reduced) {
      el.style.filter = "none";
      return;
    }
    const nodes = (nodesRef.current ??= {
      disp: outerRef.current?.querySelector("feDisplacementMap") ?? null,
      lastScale: -1,
    });
    const scale = Math.round(((1 - v) * grain) / SCALE_STEP) * SCALE_STEP;
    if (scale !== nodes.lastScale) {
      nodes.lastScale = scale;
      nodes.disp?.setAttribute("scale", String(scale));
    }
    el.style.filter = v >= 0.999 ? "none" : `url(#${filterId})`;
  });

  return (
    <div ref={outerRef} className={className}>
      <SandFilter id={filterId} />
      <div
        ref={contentRef}
        className={innerClassName}
        style={{ opacity: 0, filter: `url(#${filterId})` }}
      >
        {children}
      </div>
    </div>
  );
}
