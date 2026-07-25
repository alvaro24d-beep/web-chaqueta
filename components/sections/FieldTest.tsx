"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  PinScene,
  Shot,
  useSceneProgress,
} from "@/components/motion/PinScene";
import { VIDEO_SENDERISTA } from "@/lib/frames";

/** Altímetro del HUD que "tica" mientras graba — el visor se siente vivo. */
function AltTicker() {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref);
  const reduced = useReducedMotion();
  const [alt, setAlt] = useState(2847);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = setInterval(
      () => setAlt(2845 + Math.floor(Math.random() * 5)),
      1900,
    );
    return () => clearInterval(id);
  }, [inView, reduced]);

  return <span ref={ref}>Alt {alt.toLocaleString("es-ES")} m</span>;
}

/** El vídeo emerge de lejos y crece hasta protagonizar el plano. */
function VideoLayer() {
  const progress = useSceneProgress();
  const scale = useTransform(progress, [0.2, 0.62], [0.4, 1]);
  // Encadenada a scale (no directamente a progress): con dos suscripciones
  // independientes al mismo valor, una puede quedarse obsoleta y desincronizar
  // opacidad y tamaño; derivando una de otra siempre van a la par.
  const opacity = useTransform(scale, [0.42, 0.56], [0, 1]);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-14">
      <motion.div
        style={{ scale, opacity }}
        className="relative w-full max-w-6xl border-[3px] border-coal bg-coal"
      >
        <video
          className="block aspect-video w-full object-cover"
          src={VIDEO_SENDERISTA}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Senderista cruzando la montaña con la STRATUM 3L"
        />
        <div
          className="pointer-events-none absolute inset-0 text-bone"
          aria-hidden="true"
        >
          <div className="hud-corners absolute inset-4 opacity-90" />
          <div className="absolute inset-x-8 top-7 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] sm:text-[11px]">
            <span className="flex items-center gap-3">
              <span className="rec-dot" /> Rec — Field Unit 03
            </span>
            <span className="hidden sm:inline">42.632° N · 0.657° E</span>
          </div>
          <div className="absolute inset-x-8 bottom-7 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] sm:text-[11px]">
            <span>Stratum 3L</span>
            <AltTicker />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function FieldTest() {
  return (
    <PinScene
      id="field-test"
      heightVh={260}
      ariaLabel="Field test"
      className="bg-bone text-coal"
      dividerFill="#e8e5da"
    >
      {/* Plano 1 — el titular abre la escena y cede el sitio al vídeo */}
      <Shot
        from={0}
        to={0.34}
        className="inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-moss">
          Field test — Pirineo aragonés · 14 días
        </p>
        <h2 className="font-display uppercase leading-[0.88] text-[clamp(3rem,10vw,9rem)]">
          Probada <span className="text-outline-dark">donde duele</span>
        </h2>
      </Shot>

      <VideoLayer />

      {/* Plano 2 — la cita entra por la derecha sobre el vídeo ya grande y
          sale antes de que la cresta del final la corte */}
      <Shot
        from={0.66}
        to={0.96}
        className="inset-x-0 bottom-[9%] flex justify-center px-6"
      >
        <figure className="max-w-3xl border border-bone/25 bg-coal/85 p-7 text-bone backdrop-blur-sm sm:p-9">
          <blockquote className="text-lg leading-relaxed text-bone/90 sm:text-2xl">
            «Dos horas de aguanieve en la cresta y por dentro, seco. No pensé
            en la chaqueta ni una vez — que es exactamente lo que le pides a
            una shell.»
          </blockquote>
          <figcaption className="mt-6 font-mono text-[11px] uppercase leading-loose tracking-[0.25em] text-olive">
            — Ibon Etxarri · Guía de alta montaña UIAGM · 14 días · 61.000 m D+
          </figcaption>
        </figure>
      </Shot>
    </PinScene>
  );
}
