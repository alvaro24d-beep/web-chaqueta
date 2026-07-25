import ScrollSequence, { SeqStep } from "@/components/ScrollSequence";
import { SEQ_ANDANDO } from "@/lib/frames";

export default function Hero() {
  return (
    <ScrollSequence
      frames={SEQ_ANDANDO}
      heightVh={420}
      focusX={0.58}
      ariaLabel="STRATUM 3L — presentación"
    >
      {/* 1.6s (no el 1.2 por defecto): la salida del preloader tapa los
          primeros ~0.8s del estreno y con la duración corta apenas se vería */}
      <SeqStep
        from={0}
        to={0.3}
        duration={1.6}
        className="inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.35em] text-olive sm:text-xs">
          Vetta · Equipo de montaña
        </p>
        <h1 className="font-display uppercase leading-[0.85] text-[clamp(4.2rem,16vw,14rem)]">
          Stratum<span className="text-outline">&nbsp;3L</span>
        </h1>
        <p className="mt-7 max-w-xl text-balance text-base text-bone-dim sm:text-lg">
          La shell de tres capas para quienes no consultan el parte antes de
          decidir si salen.
        </p>
      </SeqStep>

      <SeqStep
        from={0}
        to={0.12}
        className="inset-x-0 bottom-7 flex flex-col items-center gap-3"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-dim">
          Desliza
        </span>
        <span className="scroll-cue" />
      </SeqStep>

      <SeqStep
        from={0.34}
        to={0.62}
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
        from={0.66}
        to={0.94}
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
