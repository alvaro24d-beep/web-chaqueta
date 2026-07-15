import ScrollSequence, { SeqStep } from "@/components/ScrollSequence";
import { SEQ_CIRCULO } from "@/lib/frames";

export default function Orbit() {
  return (
    <ScrollSequence
      id="ajuste"
      frames={SEQ_CIRCULO}
      heightVh={400}
      ariaLabel="Ajuste y patronaje — vista 360 grados"
    >
      <SeqStep from={0} to={1} className="left-6 top-24 sm:left-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
          Ajuste 360°
          <span className="ml-4 text-ember">giro completo</span>
        </p>
      </SeqStep>

      <SeqStep
        from={0.04}
        to={0.32}
        className="inset-y-0 left-0 flex items-center px-6 sm:px-[7vw]"
      >
        <div className="max-w-md">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-ember">
            Patronaje articulado
          </p>
          <h3 className="mb-4 font-display text-3xl uppercase leading-[0.92] sm:text-5xl">
            Se mueve contigo
          </h3>
          <p className="text-sm leading-relaxed text-bone-dim sm:text-base">
            Codos y hombros precurvados: brazos por encima de la cabeza sin que
            el dobladillo se levante ni la manga tire.
          </p>
        </div>
      </SeqStep>

      <SeqStep
        from={0.36}
        to={0.64}
        className="inset-y-0 right-0 flex items-center justify-end px-6 text-right sm:px-[7vw]"
      >
        <div className="max-w-md">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-ember">
            Ajuste en un gesto
          </p>
          <h3 className="mb-4 font-display text-3xl uppercase leading-[0.92] sm:text-5xl">
            Sin quitarte los guantes
          </h3>
          <p className="text-sm leading-relaxed text-bone-dim sm:text-base">
            Cintura, dobladillo y capucha se regulan con una sola mano. El
            cordón queda recogido: nada cuelga, nada se engancha.
          </p>
        </div>
      </SeqStep>

      <SeqStep
        from={0.7}
        to={1}
        className="inset-y-0 left-0 flex items-center px-6 sm:px-[7vw]"
      >
        <div className="max-w-md">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-ember">
            Espalda alargada
          </p>
          <h3 className="mb-4 font-display text-3xl uppercase leading-[0.92] sm:text-5xl">
            Cubre donde castiga
          </h3>
          <p className="text-sm leading-relaxed text-bone-dim sm:text-base">
            Trasera extendida que no se sale del arnés al trepar, con panel de
            alta abrasión donde la mochila roza kilómetro tras kilómetro.
          </p>
        </div>
      </SeqStep>
    </ScrollSequence>
  );
}
