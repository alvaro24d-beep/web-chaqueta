import Reveal from "@/components/Reveal";

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

export default function FeaturesGrid() {
  return (
    <section
      id="pro"
      aria-label="Características pro"
      className="bg-bone px-6 py-28 text-coal sm:px-10 sm:py-36"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 grid items-end gap-10 md:grid-cols-[1.4fr_1fr]">
          <Reveal variant="clip">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-moss">
              Sin adornos — solo ingeniería
            </p>
            <h2 className="font-display uppercase leading-[0.88] text-[clamp(3rem,9vw,8rem)]">
              Pro <span className="text-outline-dark">de serie</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="max-w-md text-lg leading-relaxed text-coal/70">
              Nada de versiones «pro» que cuestan aparte. Cada STRATUM 3L sale
              de fábrica con todo lo que la montaña va a pedirle.
            </p>
          </Reveal>
        </div>

        <ul className="grid gap-px border border-coal/15 bg-coal/15 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <li key={f.index} className="group bg-bone">
              <Reveal
                delay={(i % 3) * 90}
                className="h-full"
                innerClassName="h-full"
              >
                <div className="flex h-full flex-col p-8 transition-colors duration-500 group-hover:bg-coal group-hover:text-bone sm:p-10">
                  <p className="font-display text-5xl leading-none text-coal/15 transition-colors duration-500 group-hover:text-ember sm:text-6xl">
                    {f.index}
                  </p>
                  <h3 className="mb-3 mt-8 font-display text-2xl uppercase tracking-wide">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-coal/65 transition-colors duration-500 group-hover:text-bone/70">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
