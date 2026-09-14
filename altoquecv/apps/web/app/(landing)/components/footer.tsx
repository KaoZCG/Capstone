import React from 'react';
import { ShieldCheck } from 'lucide-react';

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
            <h4 className="font-bold text-on-surface text-sm mb-4">Producto</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><a href="#" className="hover:text-primary">Características</a></li>
              <li><a href="#" className="hover:text-primary">Cómo funciona</a></li>
              <li><a href="#" className="hover:text-primary">Plantillas ATS</a></li>
              <li><a href="#precios" className="hover:text-primary">Precios</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-on-surface text-sm mb-4">Recursos</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><a href="#" className="hover:text-primary">Casos de Éxito</a></li>
              <li><a href="#" className="hover:text-primary">Guía ATS 2025</a></li>
              <li><a href="#" className="hover:text-primary">Blog de Carrera</a></li>
              <li><a href="#" className="hover:text-primary">Centro de Ayuda</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-on-surface text-sm mb-4">Legal & Empresa</h4>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li><a href="#" className="hover:text-primary">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-primary">Términos del Servicio</a></li>
              <li><a href="#" className="hover:text-primary">Seguridad de Datos</a></li>
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