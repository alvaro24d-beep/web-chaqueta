import ScrollSequence, { SeqStep } from "@/components/ScrollSequence";
import Magnetic from "@/components/motion/Magnetic";
import { SEQ_EPICO } from "@/lib/frames";

export default function Finale() {
  return (
    <ScrollSequence
      id="comprar"
      frames={SEQ_EPICO}
      heightVh={300}
      ariaLabel="Comprar STRATUM 3L"
    >
      <SeqStep
        from={0.05}
        to={0.38}
        className="inset-0 flex items-center justify-center px-6"
      >
        <h2 className="text-center font-display uppercase leading-[0.85] text-[clamp(4rem,15vw,13rem)]">
          <span className="text-outline">Sube</span> más alto
        </h2>
      </SeqStep>

      <SeqStep
        from={0.5}
        to={1}
        className="inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.35em] text-olive">
          Edición 2026 — Verde alpino
        </p>
        <p className="font-display uppercase leading-none text-[clamp(3.4rem,10vw,7.5rem)]">
          389 €
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-bone-dim">
          IVA incluido · Tallas XS–XXL
        </p>
        <Magnetic className="mt-10">
          <a
            href="#comprar"
            className="btn-ember font-mono text-sm font-medium uppercase tracking-[0.22em]"
          >
            <span>Comprar ahora</span>
            <span aria-hidden="true">→</span>
          </a>
        </Magnetic>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dim sm:text-[11px]">
          Envío 24/48 h · Devolución 60 días · Garantía de por vida
        </p>
      </SeqStep>
    </ScrollSequence>
  );
}
