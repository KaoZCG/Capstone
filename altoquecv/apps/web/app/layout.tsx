import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
// @ts-expect-error Next.js handles global CSS side-effect imports during compilation.
import "./globals.css";
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import type { ReactNode } from "react";

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

const AuthContextProvider = AuthProvider as unknown as ({ children }: { children: ReactNode }) => JSX.Element;

export const metadata: Metadata = {
  title: "AltoqueCV - Copiloto de Empleabilidad",
  description: "Optimiza tu CV para el mercado laboral chileno.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-surface text-on-surface antialiased min-h-screen">
        <ThemeProvider>  
          <AuthContextProvider>
            {children}
          </AuthContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}