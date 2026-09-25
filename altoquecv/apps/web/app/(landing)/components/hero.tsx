'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      {/* Fondo Gradiente Sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 via-surface to-surface-container z-0" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface-variant mb-6 uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Copiloto de carrera con IA Especializada
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-extrabold text-on-surface leading-[1.1] mb-6 tracking-tight">
            Consigue más entrevistas en <span className="text-primary">tiempo récord</span> con tu copiloto inteligente de empleabilidad.
          </h1>
          
          <p className="text-lg text-on-surface-variant mb-8 leading-relaxed max-w-xl">
            AltoqueCV autocompleta tus postulaciones en Laborum, Trabajando.com y LinkedIn, optimizando tu CV en tiempo real para superar los filtros ATS con IA especializada en el mercado chileno.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href={isAuthenticated ? "/perfil-maestro" : "/signup"}>
              <Button variant="primary" className="h-12 px-8 text-base w-full sm:w-auto shadow-lg shadow-primary/20">
                {isAuthenticated ? 'Ir a Mi Perfil Maestro' : 'Comenzar gratis ahora'} <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Button variant="secondary" className="h-12 px-8 text-base w-full sm:w-auto bg-surface-container-high border-transparent text-on-surface">
              <PlayCircle size={18} className="mr-2 text-primary" /> Ver demostración
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xl font-bold text-on-surface">+15.000</p>
              <p className="text-xs text-on-surface-variant mt-1">Postulaciones enviadas</p>
            </div>
            <div>
              <p className="text-xl font-bold text-on-surface">Mercado Chileno</p>
              <p className="text-xs text-on-surface-variant mt-1">Vocabulario y formato local</p>
            </div>
            <div>
              <p className="text-xl font-bold text-on-surface">100% ATS Ready</p>
              <p className="text-xs text-on-surface-variant mt-1">Taleo, Workday y Greenhouse</p>
            </div>
          </div>
        </div>

        {/* Mock Widget Visual */}
        <div className="relative lg:ml-auto w-full max-w-md">
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-primary-container rounded-2xl blur opacity-30" />
          <div className="relative bg-surface-container-lowest border border-border rounded-xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-error" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                <div className="w-2.5 h-2.5 rounded-full bg-success" />
              </div>
              <span className="bg-success-container/30 text-success text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success" /> Conectado
              </span>
            </div>
            
            <div className="mb-6 border-b border-surface-container-highest pb-4">
              <span className="text-[10px] font-bold text-primary mb-1 block uppercase tracking-wider">LinkedIn Jobs / Laborum.cl</span>
              <h3 className="font-bold text-lg text-on-surface">Tech Lead • Fintech LATAM</h3>
              <p className="text-xs text-on-surface-variant">Santiago, Chile (Híbrido) • Renta acorde a mercado</p>
            </div>

            <div className="flex items-center gap-4 mb-6 bg-surface-container-low p-4 rounded-lg">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" className="stroke-surface-container-highest" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" className="stroke-success" strokeWidth="6" strokeDasharray="175.9" strokeDashoffset="28.1" strokeLinecap="round" />
                </svg>
                <span className="absolute text-lg font-bold text-on-surface">84%</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-surface flex items-center gap-1">Calificación ATS Alta <CheckCircle2 size={14} className="text-success"/></h4>
                <p className="text-[10px] text-on-surface-variant mt-1">Tu CV supera el umbral de filtrado automático (mínimo 75%).</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Keywords clave sincronizadas:</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-surface-container px-2 py-1 rounded text-on-surface flex items-center gap-1"><CheckCircle2 size={10} className="text-success"/> TypeScript</span>
                <span className="text-[10px] bg-surface-container px-2 py-1 rounded text-on-surface flex items-center gap-1"><CheckCircle2 size={10} className="text-success"/> AWS Architecture</span>
                <span className="text-[10px] bg-primary-container/20 text-primary px-2 py-1 rounded flex items-center gap-1 font-medium">✨ +2 adaptadas con IA</span>
              </div>
            </div>

            <Button variant="primary" className="w-full justify-between h-10 px-4 text-sm shadow-md">
              <span className="flex items-center gap-2">✨ Autocompletar</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">14/14</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}