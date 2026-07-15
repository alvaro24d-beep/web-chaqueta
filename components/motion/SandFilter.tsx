/**
 * Filtro SVG de "arena llevada por el viento". Tres ingredientes:
 *
 * 1. feTurbulence anisótropo (frecuencia X baja, Y alta): el ruido forma
 *    filamentos horizontales alargados — ráfagas — en vez de grano isótropo.
 * 2. feComponentTransfer ciñe el canal R (desplazamiento X) a UN solo lado
 *    de 0.5: todos los granos llegan desde la misma dirección. El intercept
 *    lo ajusta JS según el viento: 0.5 = desde la izquierda, 0 = derecha.
 *    El canal G (desplazamiento Y) queda casi plano: poca dispersión vertical.
 * 3. feGaussianBlur solo horizontal: estela de viento que se disipa al
 *    componerse (JS anima stdDeviation junto con scale).
 *
 * JS anima `scale` del feDisplacementMap de N→0: la nube de arena converge
 * hasta formar el contenido nítido.
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
        x="-60%"
        y="-40%"
        width="220%"
        height="180%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.015 0.45"
          numOctaves="3"
          seed="7"
          result="noise"
        />
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
          result="scattered"
        />
        <feGaussianBlur in="scattered" stdDeviation="0 0" />
      </filter>
    </svg>
  );
}
