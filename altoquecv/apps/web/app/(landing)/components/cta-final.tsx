'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CTAFinal() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-24 bg-surface px-4 md:px-8">
      <div className="max-w-6xl mx-auto bg-[#141517] rounded-3xl p-8 md:p-16 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[#a1a1aa] text-xs font-bold uppercase tracking-widest mb-4 block">Empieza hoy sin costo</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              ¿Listo para multiplicar tus respuestas de entrevista esta semana?
            </h2>
            <p className="text-[#a1a1aa] text-lg mb-8 max-w-md">
              Únete a más de 15,000 profesionales chilenos que aceleraron su búsqueda laboral. Sin tarjeta de crédito, listo en 2 minutos.
            </p>
            
            <div className="flex flex-wrap gap-4 text-sm text-[#e4e4e7]">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> Plan Gratuito Permanente</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> Extensión Chrome Segura</span>
            </div>
          </div>
          
          <div className="lg:justify-self-end w-full max-w-sm">
            <Link href={isAuthenticated ? "/perfil-maestro" : "/signup"}>
              <Button variant="primary" className="w-full h-14 text-base shadow-xl shadow-primary/20">
                {isAuthenticated ? 'Continuar a Mi Perfil' : 'Crear mi Perfil Maestro Gratis'} <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <p className="text-center text-xs text-[#71717a] mt-4">
              Compatible con cuentas de Google y LinkedIn.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}