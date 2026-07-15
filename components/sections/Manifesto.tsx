import Counter from "@/components/motion/Counter";
import DragSticker from "@/components/motion/DragSticker";
import RotatingWord from "@/components/motion/RotatingWord";
import VelocityMarquee from "@/components/motion/VelocityMarquee";
import { ClipReveal, FadeUp } from "@/components/motion/reveals";

const STATS = [
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
    <section aria-label="Manifiesto" className="relative overflow-hidden bg-coal">
      <DragSticker />

      <div className="mx-auto max-w-7xl px-6 pb-40 pt-32 sm:px-10">
        <ClipReveal>
          <h2 className="font-display uppercase leading-[0.88] text-[clamp(3rem,9.5vw,8.5rem)]">
            La montaña
            <br />
            <span className="text-outline">no perdona.</span>
          </h2>
        </ClipReveal>

        <div className="mt-14 grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-20">
          <FadeUp delay={0.1}>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-olive">
              Manifiesto — STRATUM 3L
            </p>
            <p className="mt-8 font-display text-3xl uppercase leading-[1.05] text-bone sm:text-4xl">
              Pensada para
              <br />
              <RotatingWord
                className="text-ember"
                words={["la lluvia.", "el viento.", "la ventisca.", "el granizo."]}
              />
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
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
          </FadeUp>
        </div>

        <dl className="mt-24 grid grid-cols-2 gap-px border border-bone/10 bg-bone/10 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.label} className="bg-coal p-8 sm:p-10">
              <FadeUp delay={i * 0.09}>
                <dd className="font-display text-5xl leading-none sm:text-7xl">
                  {s.prefix}
                  <Counter to={s.to} />
                  <span className="ml-2 text-2xl text-olive sm:text-3xl">
                    {s.unit}
                  </span>
                </dd>
                <dt className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em] text-bone-dim">
                  {s.label}
                </dt>
              </FadeUp>
            </div>
          ))}
        </dl>
      </div>

      <div className="-mx-4 -rotate-[1.5deg] bg-ember py-4 text-coal">
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
      </div>
    </section>
  );
}
