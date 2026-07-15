"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Config global de framer-motion: con `reducedMotion="user"` las animaciones
 * de transform/layout se desactivan si el sistema pide movimiento reducido
 * (las de opacity se conservan para no perder contenido).
 */
export default function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
