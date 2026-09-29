import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// next/font descarga y self-hostea Inter en build time: no hay request a
// fonts.googleapis.com en runtime, coincide con la decisión de tipografía
// del Design System.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Corebio Mail",
    template: "%s · Corebio Mail",
  },
  description:
    "Gestión de acceso a los mails institucionales de Corebio sin compartir credenciales.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-white font-sans text-base text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
