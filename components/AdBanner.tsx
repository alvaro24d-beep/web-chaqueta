'use client';

import { useEffect, useRef, useState } from 'react';

// Cambia esto por el dominio real del WordPress de anuncios
const ANUNCIOS_API_BASE = 'https://tudominio.com/wp-json/ads/v1';

// Por debajo de este ancho de pantalla (px) se pide la versión móvil del banner
const UMBRAL_MOVIL = 768;

// Cuánto tiempo tiene que estar el banner visible de verdad antes de
// contar la impresión — 1 segundo con al menos el 50% del banner en
// pantalla, que es el criterio de "viewability" del estándar IAB.
const TIEMPO_VISIBLE_MS = 1000;
const PORCENTAJE_VISIBLE = 0.5;

type RespuestaBanner =
  | {
      activo: true;
      id: number;
      imagen: string;
      url: string;
      ancho: number;
      alto: number;
      pixel: string;
      contada: boolean; // true si el servidor ya la contó al servirla (ver Anuncios > Ajustes)
    }
  | { activo: false; ancho: number; alto: number };

/**
 * Pinta el banner activo de una zona ("cabecera" | "lateral" | "entre-articulos").
 * Detecta automáticamente escritorio/móvil, reserva el hueco exacto
 * aunque no haya ningún anuncio activo (evita que la página salte), y
 * si el servidor no cuenta la impresión al servirla (`contada: false`,
 * el modo recomendado en Anuncios > Ajustes), confirma la impresión
 * solo cuando el banner ha estado de verdad visible en pantalla.
 *
 * Uso: <AdBanner zona="cabecera" />
 */
export default function AdBanner({ zona }: { zona: string }) {
  const [banner, setBanner] = useState<RespuestaBanner | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const yaConfirmada = useRef(false);

  useEffect(() => {
    let cancelado = false;
    const dispositivo = window.innerWidth < UMBRAL_MOVIL ? 'movil' : 'escritorio';

    fetch(`${ANUNCIOS_API_BASE}/zona/${zona}?dispositivo=${dispositivo}`)
      .then((r) => r.json())
      .then((datos: RespuestaBanner) => {
        if (!cancelado) setBanner(datos);
      })
      .catch(() => {
        if (!cancelado) setBanner({ activo: false, ancho: 0, alto: 0 });
      });

    return () => {
      cancelado = true;
    };
  }, [zona]);

  // --- Confirmación de "viewability": solo si el servidor no la contó ya al servirla ---
  useEffect(() => {
    if (!banner || !banner.activo || banner.contada) return;
    if (!contenedorRef.current || yaConfirmada.current) return;

    const elemento = contenedorRef.current;
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          // Empieza a contar el segundo de visibilidad continua
          temporizador = setTimeout(() => {
            if (yaConfirmada.current) return;
            yaConfirmada.current = true;
            fetch(banner.pixel, { method: 'POST', keepalive: true });
            observador.disconnect();
          }, TIEMPO_VISIBLE_MS);
        } else if (temporizador) {
          // Salió de pantalla antes de cumplir el segundo: se reinicia
          clearTimeout(temporizador);
          temporizador = null;
        }
      },
      { threshold: PORCENTAJE_VISIBLE }
    );

    observador.observe(elemento);

    return () => {
      if (temporizador) clearTimeout(temporizador);
      observador.disconnect();
    };
  }, [banner]);

  // Todavía no sabemos nada, o la zona no aplica a este dispositivo (ancho/alto = 0)
  if (!banner || (!banner.activo && banner.ancho === 0)) {
    return null;
  }

  return (
    <div
      ref={contenedorRef}
      style={{
        width: '100%',
        maxWidth: banner.ancho,
        aspectRatio: `${banner.ancho} / ${banner.alto}`,
        margin: '0 auto',
      }}
    >
      {banner.activo && (
        <a href={banner.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.imagen}
            alt="Publicidad"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </a>
      )}
    </div>
  );
}