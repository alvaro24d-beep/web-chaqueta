'use client';

import { useEffect, useState } from 'react';

// Cambia esto por el dominio real del WordPress de anuncios
// (el separado, con WooCommerce — no el editorial de soydezaragoza.es)
const ANUNCIOS_API_BASE = 'https://mediumaquamarine-moose-793142.hostingersite.com/wp-json/ads/v1';

type RespuestaBanner =
  | { activo: true; id: number; imagen: string; url: string }
  | { activo: false };

/**
 * Pinta el banner activo de una zona ("cabecera" | "lateral" | "entre-articulos"),
 * o no pinta nada si no hay ninguna campaña activa en ese momento.
 *
 * Uso: <AdBanner zona="cabecera" />
 */
export default function AdBanner({ zona }: { zona: string }) {
  const [banner, setBanner] = useState<RespuestaBanner | null>(null);

  useEffect(() => {
    let cancelado = false;

    fetch(`${ANUNCIOS_API_BASE}/zona/${zona}`)
      .then((r) => r.json())
      .then((datos: RespuestaBanner) => {
        if (!cancelado) setBanner(datos);
      })
      .catch(() => {
        // Si la API falla, simplemente no se muestra banner — no debe romper la página
        if (!cancelado) setBanner({ activo: false });
      });

    return () => {
      cancelado = true;
    };
  }, [zona]);

  if (!banner || !banner.activo) {
    return null;
  }

  return (
    <a
      href={banner.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-block' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.imagen}
        alt="Publicidad"
        style={{ maxWidth: '100%', display: 'block' }}
      />
    </a>
  );
}
