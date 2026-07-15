const COLS = [
  {
    title: "Producto",
    links: ["Stratum 3L", "Guía de tallas", "Cuidados", "Reparaciones"],
  },
  {
    title: "Soporte",
    links: ["Envíos", "Devoluciones", "Garantía", "Contacto"],
  },
  {
    title: "Vetta",
    links: ["Manifiesto", "Field tests", "Sostenibilidad", "Prensa"],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-bone/10 bg-coal px-6 pb-10 pt-20 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-6xl uppercase leading-none text-outline sm:text-8xl">
              Vetta
            </p>
            <p className="mt-5 max-w-xs font-mono text-[11px] uppercase leading-loose tracking-[0.22em] text-bone-dim">
              Equipo de montaña
              <br />
              Diseñado en los Pirineos
            </p>
          </div>
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-olive">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#top"
                      className="text-sm text-bone-dim transition-colors hover:text-bone"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-20 border-t border-bone/10 pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dim/70">
          © 2026 Vetta Mountain Equipment — Página ficticia de demostración
        </p>
      </div>
    </footer>
  );
}
