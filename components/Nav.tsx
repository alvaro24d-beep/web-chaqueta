export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference text-white">
      <nav className="flex items-center justify-between px-5 py-5 sm:px-10">
        <a href="#top" className="font-display text-2xl uppercase tracking-wide">
          Vetta<span className="text-ember">▲</span>
        </a>
        <ul className="hidden items-center gap-9 font-mono text-[11px] uppercase tracking-[0.24em] md:flex">
          <li>
            <a className="transition-opacity hover:opacity-50" href="#detalles">
              Detalles
            </a>
          </li>
          <li>
            <a className="transition-opacity hover:opacity-50" href="#pro">
              Pro
            </a>
          </li>
          <li>
            <a className="transition-opacity hover:opacity-50" href="#ajuste">
              Ajuste
            </a>
          </li>
          <li>
            <a className="transition-opacity hover:opacity-50" href="#field-test">
              Field test
            </a>
          </li>
        </ul>
        <a
          href="#comprar"
          className="border border-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] transition-colors hover:bg-white hover:text-black"
        >
          Comprar — 389 €
        </a>
      </nav>
    </header>
  );
}
