"use client";

import {
  animate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { usePageReady } from "@/lib/frameStore";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Entrada "de arena": el contenido llega disgregado en granos (ruido SVG +
 * mapa de desplazamiento) desde el lado indicado y se compone progresivamente
 * hasta formar el texto nítido. mode="mount" espera a que el Preloader suelte
 * la página; mode="view" dispara al entrar en el viewport.
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
  grain = 140,
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
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const p = useMotionValue(0);
  const reduced = useReducedMotion();
  const ready = usePageReady();

  const inView = useInView(outerRef, {
    once: true,
    amount: 0.3,
    margin: "0px 0px -8% 0px",
  });
  const trigger = mode === "mount" ? ready : inView;

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
    dispRef.current?.setAttribute("scale", ((1 - v) * grain).toFixed(1));
    el.style.filter = v >= 0.999 ? "none" : `url(#${filterId})`;
  });

  return (
    <div ref={outerRef} className={className}>
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
            scale={grain}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
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
