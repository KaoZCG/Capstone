import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${montserrat.variable} ${inter.variable}`}>
      <body className="bg-surface text-on-surface antialiased min-h-screen">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}