import type { Metadata, Viewport } from "next";
import { Anton, Archivo, IBM_Plex_Mono } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import MotionRoot from "@/components/motion/MotionRoot";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "VETTA — STRATUM 3L · Chaqueta técnica de montaña",
  description:
    "STRATUM 3L: shell de 3 capas, 28.000 mm de columna de agua y 315 g. Hecha para el mal tiempo. Probada donde duele.",
};

export const viewport: Viewport = {
  themeColor: "#0c0e09",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${archivo.variable} ${plexMono.variable} antialiased`}
    >
      <body>
        <SmoothScroll />
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}
