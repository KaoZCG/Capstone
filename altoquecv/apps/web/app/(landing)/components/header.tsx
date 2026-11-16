'use client';

import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/layout/ThemeProvider';

export function LandingHeader() {
  const { toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-on-primary rounded-lg font-extrabold text-lg flex items-center justify-center">A</div>
          <span className="text-xl font-bold text-on-surface tracking-tight">Altoque<span className="text-primary">CV</span></span>
        </Link>

        {/* Links de Navegación */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-on-surface-variant">
          <Link href="#inicio" className="hover:text-primary transition-colors">Inicio</Link>
          <Link href="#caracteristicas" className="hover:text-primary transition-colors">Características</Link>
          <Link href="#como-funciona" className="hover:text-primary transition-colors">Cómo funciona</Link>

        </nav>

        {/* Acciones & Configuración */}
        <div className="flex items-center gap-4">

          {/* Botón Modo Oscuro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-surface-container-low border border-border text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-1.5"
            aria-label="Alternar modo oscuro"
          >
            <Moon size={18} aria-hidden="true" className="block text-slate-700 dark:hidden" />
            <Sun size={18} aria-hidden="true" className="hidden text-amber-500 dark:block" />
          </button>

          {/* Acceso a Auth */}
          <Link
            href="/login"
            className="hidden sm:inline-block px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high rounded-lg border border-border transition-all"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-semibold text-on-primary bg-primary hover:bg-primary/95 hover:shadow-md transition-all rounded-lg"
          >
            Crear cuenta
          </Link>
        </div>

      </div>
    </header>
  );
}