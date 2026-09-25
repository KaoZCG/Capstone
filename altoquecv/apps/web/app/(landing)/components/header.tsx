'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle'; // ← AGREGAR
import { Menu } from 'lucide-react'; // ← ya no necesitas Moon, Sun aquí

export function LandingHeader() {
  const { usuario, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary text-on-primary rounded font-bold text-xs flex items-center justify-center">A</div>
          <span className="font-bold text-lg text-on-surface">AltoqueCV</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-on-surface-variant">
          <a href="#caracteristicas" className="hover:text-primary transition-colors">Características</a>
          <a href="#como-funciona" className="hover:text-primary transition-colors">Cómo funciona</a>
          <a href="#testimonios" className="hover:text-primary transition-colors">Testimonios</a>
          <a href="#precios" className="hover:text-primary transition-colors">Precios</a>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle /> {/* ← REEMPLAZO */}

          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="text-sm font-medium text-on-surface hover:text-primary transition-colors">
                  Iniciar Sesión
                </Link>
                <Link href="/signup">
                  <Button variant="primary">Comenzar Gratis</Button>
                </Link>
              </>
            ) : (
              <Link href="/perfil-maestro">
                <Button variant="primary">Mi Perfil Maestro</Button>
              </Link>
            )}
          </div>

          <button className="md:hidden text-on-surface">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}