/**
 * Filtro SVG de "arena llevada por el viento", optimizado para animarse a
 * 60 fps: el ruido NO se genera con feTurbulence (recalcular el fractal por
 * píxel en cada frame es lo que atiranta la animación) sino que viene
 * horneado en /sand-noise.png — R con ráfagas horizontales estiradas, G con
 * grano fino — y el navegador lo decodifica una única vez.
 *
 * feComponentTransfer ciñe el canal R (desplazamiento X) a UN solo lado de
 * 0.5: todos los granos llegan desde la misma dirección. El intercept lo
 * ajusta JS según el viento: 0.5 = desde la izquierda, 0 = derecha. El canal
 * G (desplazamiento Y) queda casi plano: poca dispersión vertical.
 *
 * JS anima `scale` del feDisplacementMap de N→0 (en pasos cuantizados): la
 * ráfaga de arena converge hasta formar el contenido nítido.
 */
export default function SandFilter({ id }: { id: string }) {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      className="pointer-events-none absolute"
    >
      <filter
        id={id}
        x="-45%"
        y="-25%"
        width="190%"
        height="150%"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href="/sand-noise.png"
          x="0"
          y="0"
          width="512"
          height="256"
          result="img"
        />
        <feTile in="img" result="noise" />
        <feComponentTransfer in="noise" result="wind">
          <feFuncR type="linear" slope="0.5" intercept="0.5" />
          <feFuncG type="linear" slope="0.14" intercept="0.43" />
        </feComponentTransfer>
        <feDisplacementMap
          in="SourceGraphic"
          in2="wind"
          scale="0"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
