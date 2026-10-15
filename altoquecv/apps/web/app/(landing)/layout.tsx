import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LandingHeader } from './components/header';

export const metadata: Metadata = {
  title: 'AltoqueCV - Copiloto de Empleabilidad Inteligente',
  description: 'Analiza tu CV contra ofertas laborales, optimiza automáticamente y postula con 1-click en portales chilenos.',
};

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <LandingHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
