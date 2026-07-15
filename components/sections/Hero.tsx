import ScrollSequence, { SeqStep } from "@/components/ScrollSequence";
import SplitLetters from "@/components/motion/SplitLetters";
import { SlideIn } from "@/components/motion/reveals";
import { SEQ_ANDANDO } from "@/lib/frames";

export default function Hero() {
  return (
    <ScrollSequence
      frames={SEQ_ANDANDO}
      heightVh={420}
      focusX={0.58}
      ariaLabel="STRATUM 3L — presentación"
    >
      <SeqStep
        from={0}
        to={0.2}
        dir="zoom"
        className="inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <SlideIn from="fade" delay={0.25}>
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.35em] text-olive sm:text-xs">
            Vetta · Equipo de montaña
          </p>
        </SlideIn>
        <h1
          aria-label="Stratum 3L"
          className="font-display uppercase leading-[0.85] text-[clamp(4.2rem,16vw,14rem)]"
        >
          <SplitLetters text="Stratum" delay={0.45} />
          <SplitLetters
            text={" 3L"}
            className="text-outline"
            delay={0.85}
          />
        </h1>
        <SlideIn from="fade" delay={1.15}>
          <p className="mt-7 max-w-xl text-balance text-base text-bone-dim sm:text-lg">
            La shell de tres capas para quienes no consultan el parte antes de
            decidir si salen.
          </p>
        </SlideIn>
      </SeqStep>

      <SeqStep
        from={0}
        to={0.09}
        dir="zoom"
        className="inset-x-0 bottom-7 flex flex-col items-center gap-3"
      >
        <SlideIn from="fade" delay={1.5} className="flex flex-col items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-dim">
            Desliza
          </span>
          <span className="scroll-cue" />
        </SlideIn>
      </SeqStep>

      <SeqStep
        from={0.3}
        to={0.56}
        dir="left"
        className="inset-y-0 left-0 flex items-center px-6 sm:px-[8vw]"
      >
        <div className="max-w-md">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-ember">
            01 — Propósito
          </p>
          <h2 className="mb-5 font-display text-4xl uppercase leading-[0.9] sm:text-6xl">
            Hecha para el mal tiempo
          </h2>
          <p className="text-bone-dim sm:text-lg">
            Viento de 90 km/h, aguanieve horizontal, granito mojado. El día en
            que todos bajan es el día para el que fue diseñada.
          </p>
        </div>
      </SeqStep>

      <SeqStep
        from={0.64}
        to={0.92}
        dir="right"
        className="inset-y-0 right-0 flex items-center justify-end px-6 text-right sm:px-[8vw]"
      >
        <div className="max-w-md">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-ember">
            02 — Silencio
          </p>
          <h2 className="mb-5 font-display text-4xl uppercase leading-[0.9] sm:text-6xl">
            315 g que no notas
          </h2>
          <p className="text-bone-dim sm:text-lg">
            Laminado de 3 capas sin forro suelto: nada cruje, nada estorba.
            Solo tú y la pendiente.
          </p>
        </div>
      </SeqStep>
    </ScrollSequence>
  );
}
