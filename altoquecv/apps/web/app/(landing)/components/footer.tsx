import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-primary text-on-primary rounded font-bold text-[10px] flex items-center justify-center">A</div>
              <span className="font-bold text-on-surface">AltoqueCV</span>
            </div>
            <p className="text-sm text-on-surface-variant max-w-xs mb-6">
              Copiloto inteligente de empleabilidad. Optimiza tu CV para estándares fintech y corporativos de alta demanda.
            </p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-xs font-medium text-on-surface">
              <ShieldCheck size={14} className="text-success" /> Tecnología Chilena para LATAM
            </span>
          </div>

          <div>
            <h3 className="font-bold text-on-surface text-sm mb-4">Producto</h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><Link href="/#caracteristicas" className="hover:text-primary">Características</Link></li>
              <li><Link href="/#como-funciona" className="hover:text-primary">Cómo funciona</Link></li>
              <li><Link href="/#comparador-ats" className="hover:text-primary">Comparador ATS</Link></li>
              <li><span>Planes de pago: próximamente</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-on-surface text-sm mb-4">Recursos</h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><Link href="/#testimonios" className="hover:text-primary">Casos de Éxito</Link></li>
              <li><span>Guía ATS: próximamente</span></li>
              <li><span>Blog de Carrera: próximamente</span></li>
              <li><span>Centro de Ayuda: próximamente</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-on-surface text-sm mb-4">Legal & Empresa</h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><span>Política de Privacidad: próximamente</span></li>
              <li><span>Términos del Servicio: próximamente</span></li>
              <li><span>Seguridad de Datos: próximamente</span></li>
              <li><span className="text-on-surface-variant/70">Santiago, Chile</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-on-surface-variant">
            © {new Date().getFullYear()} AltoqueCV SpA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-success" /> Fintech-Grade Security</span>
            <span>CL 🇨🇱</span>
          </div>
        </div>
      </div>
    </footer>
  );
}