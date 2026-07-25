import ScrollSequence, { SeqStep } from "@/components/ScrollSequence";
import { SEQ_CREMALLERA } from "@/lib/frames";

const CALLOUTS = [
  {
    from: 0.05,
    to: 0.29,
    side: "left",
    index: "01",
    title: "Cremallera AquaGuard®",
    body: "Estanca por construcción, sin faldón interior: menos peso, menos volumen y cero filtraciones incluso bajo lluvia sostenida.",
  },
  {
    from: 0.29,
    to: 0.53,
    side: "right",
    index: "02",
    title: "Capucha StormHood™",
    body: "Compatible con casco, ajuste de tres puntos y visera semirrígida que no cede con rachas de viento.",
  },
  {
    from: 0.53,
    to: 0.77,
    side: "left",
    index: "03",
    title: "Cuello térmico",
    body: "Interior de microfibra cepillada: cálido al contacto desde el primer segundo, incluso con la cara empapada.",
  },
  {
    from: 0.77,
    to: 1,
    side: "right",
    index: "04",
    title: "Tiradores XL",
    body: "Dimensionados para guantes de alta montaña. Todos los ajustes de la chaqueta se operan con una sola mano.",
  },
] as const;

export default function Details() {
  return (
    <ScrollSequence
      id="detalles"
      frames={SEQ_CREMALLERA}
      heightVh={520}
      dividerFill="#0c0e09"
      ariaLabel="Detalles construidos"
    >
      <SeqStep from={0} to={1} className="left-6 top-24 sm:left-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
          Detalles construidos
          <span className="ml-4 text-ember">01–04</span>
        </p>
      </SeqStep>

      {CALLOUTS.map((c) => (
        <SeqStep
          key={c.index}
          from={c.from}
          to={c.to}
          className={`inset-y-0 flex items-center px-6 sm:px-[7vw] ${
            c.side === "left"
              ? "left-0 justify-start"
              : "right-0 justify-end text-right"
          }`}
        >
          <div
            className={`hud-corners max-w-sm p-7 text-ember sm:max-w-md sm:p-9 ${
              c.side === "right" ? "items-end" : ""
            }`}
          >
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-ember">
              {c.index} / 04
            </p>
            <h3 className="mb-4 font-display text-3xl uppercase leading-[0.92] text-bone sm:text-5xl">
              {c.title}
            </h3>
            <p className="text-sm leading-relaxed text-bone-dim sm:text-base">
              {c.body}
            </p>
          </div>
        </SeqStep>
      ))}
    </ScrollSequence>
  );
}
