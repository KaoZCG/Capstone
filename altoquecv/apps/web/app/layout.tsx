import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
// @ts-expect-error Next.js handles global CSS side-effect imports during compilation.
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AltoqueCV - Copiloto de Empleabilidad",
  description: "Optimiza tu CV para el mercado laboral chileno.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${inter.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}