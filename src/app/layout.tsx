import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "City Gol",
  description: "City Gol MVP base app",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
