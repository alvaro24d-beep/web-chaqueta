import Reveal from "@/components/Reveal";
import { VIDEO_SENDERISTA } from "@/lib/frames";

export default function FieldTest() {
  return (
    <section
      id="field-test"
      aria-label="Field test"
      className="bg-bone px-6 py-28 text-coal sm:px-10 sm:py-36"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <Reveal variant="clip">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-moss">
              Field test — Pirineo aragonés · 14 días
            </p>
            <h2 className="font-display uppercase leading-[0.88] text-[clamp(3rem,9vw,8rem)]">
              Probada <span className="text-outline-dark">donde duele</span>
            </h2>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <figure className="mx-auto max-w-5xl">
            <div className="relative border-[3px] border-coal bg-coal">
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
                  <span>Alt 2.847 m</span>
                </div>
              </div>
            </div>
            <figcaption className="mt-10 grid gap-8 md:grid-cols-[1.5fr_1fr] md:gap-16">
              <blockquote className="text-xl leading-relaxed text-coal/85 sm:text-2xl">
                «Dos horas de aguanieve en la cresta y por dentro, seco. No
                pensé en la chaqueta ni una vez — que es exactamente lo que le
                pides a una shell.»
              </blockquote>
              <p className="self-end font-mono text-[11px] uppercase leading-loose tracking-[0.25em] text-moss">
                — Ibon Etxarri
                <br />
                Guía de alta montaña UIAGM
                <br />
                14 días · 61.000 m D+
              </p>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
