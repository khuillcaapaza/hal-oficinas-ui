import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión de Oficinas · Hospital Antonio Lorena",
  description: "Panel de administración de oficinas — Hospital Antonio Lorena",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Íconos keenicons auto-hospedados (public/keenicons). Mismo origen: el CSP
  // 'self' de fuentes/estilos los permite sin cambios.
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href={`${basePath}/keenicons/outline/style.css`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
