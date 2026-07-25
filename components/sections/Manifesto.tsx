"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import DragSticker from "@/components/motion/DragSticker";
import {
  PinScene,
  ScrubCounter,
  Shot,
  useSceneCue,
} from "@/components/motion/PinScene";
import RotatingWord from "@/components/motion/RotatingWord";
import VelocityMarquee from "@/components/motion/VelocityMarquee";
import { EASE_OUT } from "@/lib/motion";

/**
 * La marquesina vive pegada al borde inferior: se desvanece al final de la
 * escena para que la cresta de la siguiente sección no la corte a medias.
 * Estado por umbral (useSceneCue), no scrub: fiable y se reproduce entera.
 */
function MarqueeBand({ children }: { children: ReactNode }) {
  const gone = useSceneCue(0.87);
  return (
    <motion.div
      initial={false}
      animate={{ opacity: gone ? 0 : 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="absolute inset-x-[-1rem] bottom-6 -rotate-[1.5deg] bg-ember py-4 text-coal"
    >
      {children}
    </motion.div>
  );
}


const STATS: {
  prefix?: string;
  to: number;
  unit: string;
  label: string;
}[] = [
  { to: 28000, unit: "mm", label: "Columna de agua" },
  { prefix: "<", to: 6, unit: "RET", label: "Transpirabilidad" },
  { to: 315, unit: "g", label: "Peso · talla M" },
  { to: 3, unit: "capas", label: "Laminado técnico" },
];

const MARQUEE = [
  "Impermeable 28.000 mm",
  "Cortavientos total",
  "Ripstop 70D",
  "Costuras selladas",
  "315 g",
  "3 capas",
  "Garantía de por vida",
];

export default function Manifesto() {
  return (
    <PinScene
      heightVh={320}
      ariaLabel="Manifiesto"
      className="bg-coal"
      dividerFill="#0c0e09"
    >
      <DragSticker />

      {/* Plano 1 — sentencia */}
      <Shot
        from={0}
        to={0.34}
        className="inset-0 flex items-center justify-center px-6 pb-24"
      >
        <h2 className="text-center font-display uppercase leading-[0.88] text-[clamp(3rem,11vw,10rem)]">
          La montaña
          <br />
          <span className="text-outline">no perdona.</span>
        </h2>
      </Shot>

      {/* Plano 2 — manifiesto */}
      <Shot
        from={0.34}
        to={0.66}
        className="inset-0 flex items-center px-6 pb-24 sm:px-[8vw]"
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1fr_1.3fr] md:gap-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-olive">
              Manifiesto — STRATUM 3L
            </p>
            <p className="mt-8 font-display text-3xl uppercase leading-[1.05] text-bone sm:text-5xl">
              Pensada para
              <br />
              <RotatingWord
                className="text-ember"
                words={["la lluvia.", "el viento.", "la ventisca.", "el granizo."]}
              />
            </p>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-bone-dim sm:text-xl">
            Por eso cada costura, cada gramo y cada milímetro de membrana de
            la STRATUM 3L están ahí por una razón — y todo lo que no la
            tenía, se quedó fuera. Sin faldones que pesan, sin forros que
            crujen, sin promesas de catálogo.{" "}
            <span className="text-bone">
              Solo protección seria, medida en laboratorio y validada en
              cresta.
            </span>
          </p>
        </div>
      </Shot>

      {/* Plano 3 — datos que cuentan con el scroll */}
      <Shot
        from={0.66}
        to={1}
        className="inset-0 flex items-center justify-center px-6 pb-24 sm:px-[8vw]"
      >
        <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px border border-bone/10 bg-bone/10 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-coal p-8 sm:p-10">
              <dd className="font-display text-5xl leading-none sm:text-7xl">
                <ScrubCounter
                  to={s.to}
                  start={0.7}
                  end={0.92}
                  prefix={s.prefix ?? ""}
                />
                <span className="ml-2 text-2xl text-olive sm:text-3xl">
                  {s.unit}
                </span>
              </dd>
              <dt className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em] text-bone-dim">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </Shot>

      {/* Banda persistente durante la escena (se funde antes de la cresta) */}
      <MarqueeBand>
        <VelocityMarquee baseVelocity={3}>
          {MARQUEE.map((item) => (
            <span
              key={item}
              className="mx-6 flex items-center gap-12 font-mono text-sm font-medium uppercase tracking-[0.22em]"
            >
              {item} <span aria-hidden="true">✦</span>
            </span>
          ))}
        </VelocityMarquee>
      </MarqueeBand>
    </PinScene>
  );
}
