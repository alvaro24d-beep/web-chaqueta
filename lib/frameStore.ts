import { useSyncExternalStore } from "react";

/**
 * Caché global de fotogramas compartida entre el preloader y los canvas de
 * ScrollSequence: se descarga todo una vez y cada canvas dibuja siempre el
 * fotograma exacto (nada de "el más cercano cargado" = tirones al inicio).
 */

type Listener = () => void;

const imgs = new Map<string, HTMLImageElement>();
const queued = new Set<string>();
const queues: string[][] = [];
const listeners = new Set<Listener>();

let loadedCount = 0;
let totalCount = 0;
let running = 0;

const CONCURRENCY = 14;

function notify() {
  for (const fn of listeners) fn();
}

function pump() {
  while (running < CONCURRENCY) {
    let url: string | undefined;
    for (const q of queues) {
      if (q.length) {
        url = q.shift();
        break;
      }
    }
    if (!url) return;
    const src = url;
    running++;
    const img = new Image();
    img.decoding = "async";
    const done = () => {
      running--;
      loadedCount++;
      notify();
      pump();
    };
    img.onload = () => {
      imgs.set(src, img);
      done();
    };
    img.onerror = done;
    img.src = src;
  }
}

/** Encola secuencias completas (en orden de prioridad). Idempotente. */
export function preloadSequences(sequences: string[][]) {
  for (const seq of sequences) {
    const fresh = seq.filter((u) => !queued.has(u));
    if (!fresh.length) continue;
    fresh.forEach((u) => queued.add(u));
    totalCount += fresh.length;
    queues.push([...fresh]);
  }
  pump();
  notify();
}

export const getFrame = (url: string) => imgs.get(url);

export const frameProgress = () => ({ loaded: loadedCount, total: totalCount });

export function onFrameLoad(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const isComplete = () => totalCount > 0 && loadedCount >= totalCount;

let released = false;

/** El Preloader suelta la página (por carga completa O por failsafe). */
export function releasePage() {
  if (released) return;
  released = true;
  notify();
}

/** Versión imperativa para bucles rAF (ScrollSequence). */
export const isPageReady = () => released || isComplete();

/**
 * true cuando la página está liberada: precarga completa o failsafe del
 * Preloader. Las animaciones de arranque deben esperar a esto — nunca a
 * "todo cargado" a secas, o en conexiones lentas no se dispararían jamás.
 */
export function usePageReady() {
  return useSyncExternalStore(
    (cb) => onFrameLoad(cb),
    () => isPageReady(),
    () => false,
  );
}
