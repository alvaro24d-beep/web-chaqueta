/**
 * Separador de sección: cresta de montaña dentada del color de la sección a
 * la que pertenece, colgando de su borde superior (cubre a la sección
 * anterior mientras esta entra). Dos capas derivan lateralmente a distinta
 * velocidad — paralaje de cordillera en movimiento perpetuo — y una línea
 * ember recorre la cresta frontal.
 *
 * Los caminos son teselables (misma y en 0 y 1440): cada capa duplica el
 * tile y anima translateX(-50%) en bucle, sin costuras. Solo transform →
 * animación compositada, coste ~0.
 */

const FRONT_RIDGE =
  "M0,70L96,46L168,58L264,34L336,56L432,40L528,64L612,36L708,52L804,42L888,60L972,34L1068,50L1152,40L1248,58L1332,46L1440,70";
const FRONT_FILL = `${FRONT_RIDGE}L1440,122L0,122Z`;

const BACK_RIDGE =
  "M0,84L72,34L156,60L228,14L312,50L396,24L480,58L576,10L660,44L756,20L840,54L924,12L1020,40L1104,26L1188,52L1284,16L1368,44L1440,84";
const BACK_FILL = `${BACK_RIDGE}L1440,122L0,122Z`;

export default function SectionDivider({ fill }: { fill: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-px z-10 h-16 -translate-y-full overflow-hidden sm:h-28"
    >
      <svg
        className="divider-back absolute bottom-0 left-0 h-full w-[200%]"
        viewBox="0 0 2880 120"
        preserveAspectRatio="none"
      >
        <path d={BACK_FILL} fill={fill} opacity="0.55" />
        <path
          d={BACK_FILL}
          fill={fill}
          opacity="0.55"
          transform="translate(1440 0)"
        />
      </svg>
      <svg
        className="divider-front absolute bottom-0 left-0 h-full w-[200%]"
        viewBox="0 0 2880 120"
        preserveAspectRatio="none"
      >
        <path d={FRONT_FILL} fill={fill} />
        <path d={FRONT_FILL} fill={fill} transform="translate(1440 0)" />
        <path
          d={FRONT_RIDGE}
          fill="none"
          stroke="#ff5b1f"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          opacity="0.9"
        />
        <path
          d={FRONT_RIDGE}
          fill="none"
          stroke="#ff5b1f"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          opacity="0.9"
          transform="translate(1440 0)"
        />
      </svg>
    </div>
  );
}
