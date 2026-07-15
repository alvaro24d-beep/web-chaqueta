"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/motion";
import { useMediaQuery } from "@/lib/useMediaQuery";
import SectionDivider from "@/components/SectionDivider";
import SandText from "@/components/motion/SandText";
import TiltCard from "@/components/motion/TiltCard";
import { useSceneHeightVh } from "@/lib/useSceneHeight";

const FEATURES = [
  {
    index: "01",
    title: "Membrana DryCore 3L",
    body: "28.000 mm de columna de agua y RET < 6: seco por fuera, seco por dentro. La membrana respira más rápido de lo que tú sudas.",
  },
  {
    index: "02",
    title: "Costuras termoselladas",
    body: "Cinta de 13 mm en el 100 % de las costuras. No hay atajos: cada unión está sellada, también las que no ves.",
  },
  {
    index: "03",
    title: "Ripstop 70D reforzado",
    body: "Hombros y caderas con tejido de mayor gramaje, donde la mochila y la roca castigan. El resto, ligereza pura.",
  },
  {
    index: "04",
    title: "Ventilación pit-zip",
    body: "Cremalleras YKK® bajo el brazo para soltar calor en aproximación sin quitarte la chaqueta ni parar el ritmo.",
  },
  {
    index: "05",
    title: "Compatible con arnés",
    body: "Dos bolsillos napoleón altos, accesibles con mochila, arnés o las dos cosas. Nada queda enterrado bajo el cinturón.",
  },
  {
    index: "06",
    title: "Empacable",
    body: "Se pliega dentro de su propio bolsillo: 1,2 litros en la mochila y 315 gramos que ni recuerdas hasta que los necesitas.",
  },
];

/**
 * Escena de travelling horizontal: la sección se fija y el scroll vertical
 * desplaza la fila de paneles en horizontal, como recorrer un plano lateral.
 */
export default function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [maxShift, setMaxShift] = useState(0);
  const effectiveVh = useSceneHeightVh(340);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () =>
      setMaxShift(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const x = useTransform(scrollYProgress, [0.04, 0.96], [0, -maxShift]);
  const barScaleX = useTransform(scrollYProgress, [0.04, 0.96], [0, 1]);
  // La barra se funde al final para que la cresta entrante no la corte
  // (estado por umbral, no scrub: fiable y se reproduce entera).
  const [barGone, setBarGone] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (p) => setBarGone(p > 0.93));
  // useMediaQuery (useSyncExternalStore) y no useReducedMotion: el layout
  // cambia de árbol entero y debe hidratar con el snapshot del servidor.
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Movimiento reducido: nada de travelling lateral — grid vertical estático.
  if (reduced) {
    return (
      <section
        id="pro"
        aria-label="Características pro"
        className="relative bg-bone px-6 py-28 text-coal sm:px-10 sm:py-36"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 max-w-2xl">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-moss">
              Sin adornos — solo ingeniería
            </p>
            <h2 className="font-display uppercase leading-[0.88] text-[clamp(3rem,7.5vw,7rem)]">
              Pro <span className="text-outline-dark">de serie</span>
            </h2>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-coal/70">
              Nada de versiones «pro» que cuestan aparte. Cada STRATUM 3L sale
              de fábrica con todo lo que la montaña va a pedirle.
            </p>
          </div>
          <ul className="grid gap-px border border-coal/15 bg-coal/15 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.index} className="bg-bone">
                <div className="flex h-full flex-col p-8 sm:p-10">
                  <p className="font-display text-6xl leading-none text-coal/15 sm:text-7xl">
                    {f.index}
                  </p>
                  <h3 className="mb-3 mt-8 font-display text-2xl uppercase tracking-wide sm:text-3xl">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-coal/65 sm:text-base">
                    {f.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <SectionDivider fill="#e8e5da" />
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="pro"
      aria-label="Características pro"
      className="relative bg-bone text-coal"
      style={{ height: `${effectiveVh}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-max items-stretch gap-6 px-6 sm:gap-10 sm:px-16"
        >
          <div className="flex w-[82vw] shrink-0 flex-col justify-center sm:w-[46vw]">
            <SandText from="left" duration={1.3}>
              <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-moss">
                Sin adornos — solo ingeniería
              </p>
              <h2 className="font-display uppercase leading-[0.88] text-[clamp(3rem,7.5vw,7rem)]">
                Pro <span className="text-outline-dark">de serie</span>
              </h2>
              <p className="mt-8 max-w-md text-lg leading-relaxed text-coal/70">
                Nada de versiones «pro» que cuestan aparte. Cada STRATUM 3L
                sale de fábrica con todo lo que la montaña va a pedirle.
              </p>
              <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.3em] text-ember">
                Sigue deslizando — la escena avanza en horizontal →
              </p>
            </SandText>
          </div>

          {FEATURES.map((f) => (
            <div
              key={f.index}
              className="group w-[74vw] shrink-0 border border-coal/15 bg-bone sm:w-[42vw] lg:w-[30vw]"
            >
              <TiltCard className="h-full">
                <SandText
                  from="right"
                  className="h-full"
                  innerClassName="h-full"
                >
                  <div className="flex h-full min-h-[52vh] flex-col p-8 transition-colors duration-250 group-hover:bg-coal group-hover:text-bone sm:p-10">
                    <p className="font-display text-6xl leading-none text-coal/15 transition-colors duration-250 group-hover:text-ember sm:text-7xl">
                      {f.index}
                    </p>
                    <h3 className="mb-3 mt-auto font-display text-2xl uppercase tracking-wide sm:text-3xl">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-coal/65 transition-colors duration-250 group-hover:text-bone/70 sm:text-base">
                      {f.body}
                    </p>
                  </div>
                </SandText>
              </TiltCard>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: barGone ? 0 : 1 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="absolute inset-x-6 bottom-10 sm:inset-x-16"
        >
          <div className="h-[2px] bg-coal/15">
            <motion.div
              style={{ scaleX: barScaleX }}
              className="h-full origin-left bg-ember"
            />
          </div>
        </motion.div>
      </div>
      <SectionDivider fill="#e8e5da" />
    </section>
  );
}
