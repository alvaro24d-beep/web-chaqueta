// Secuencias de fotogramas servidas desde /public/Videos.
// Los nombres de carpeta contienen espacios y acentos: siempre encodeURIComponent.

function frameUrls(folder: string, indices: number[]): string[] {
  const dir = `/Videos/${encodeURIComponent(folder)}`;
  return indices.map(
    (i) => `${dir}/frame_${String(i).padStart(3, "0")}.jpg`,
  );
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, k) => from + k);
}

// Chaqueta caminando de perfil (240 frames)
export const SEQ_ANDANDO = frameUrls("andando_frames", range(1, 240));

// Primer plano de cremallera y capucha (241 frames)
export const SEQ_CREMALLERA = frameUrls(
  "Cremallera_y_capucha_frames",
  range(1, 241),
);

// Vuelta de cámara de 360° que termina en la espalda (140 frames)
export const SEQ_CIRCULO = frameUrls(
  "Circulo alrededor termina en la espalda",
  range(1, 140),
);

// Contrapicado épico (la numeración original tiene huecos: faltan 124, 125 y 127)
export const SEQ_EPICO = frameUrls("Desde abajo epico", [
  ...range(1, 123),
  126,
  128,
]);

// Vídeo normal para el marco de la sección Field Test
export const VIDEO_SENDERISTA = `/Videos/${encodeURIComponent(
  "senderista en montaña.MP4",
)}`;
