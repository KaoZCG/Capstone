import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

declare const require: (id: string) => unknown;
require('./style.css'); // Plasmo procesa el CSS global para el popup directamente

export default function Popup() {
  const handleOpenApp = () => {
    window.open('http://localhost:3000/perfil-maestro', '_blank');
  };

  return (
    <div className="w-72 p-5 bg-[hsl(var(--surface))] font-sans border border-[hsl(var(--border))]">
      <div className="flex items-center gap-3 mb-5 border-b border-[hsl(var(--border))] pb-3">
        <div className="w-8 h-8 bg-[hsl(var(--primary))] text-white rounded font-bold flex items-center justify-center text-lg">A</div>
        <h1 className="text-lg font-bold text-[hsl(var(--on-surface))]">AltoqueCV</h1>
      </div>

      <div className="bg-[hsl(var(--success-container))]/20 border border-[hsl(var(--success))]/20 rounded-md p-3 mb-4 flex items-center gap-3">
        <CheckCircle2 className="text-[hsl(var(--success))]" size={20} />
        <div>
          <p className="text-sm font-bold text-[hsl(var(--success))]">Extensión Activa</p>
          <p className="text-xs text-[hsl(var(--on-surface-variant))]">5 portales soportados</p>
        </div>
      </div>

      <div className="mb-5">
        <h2 className="text-xs font-bold text-[hsl(var(--on-surface-variant))] uppercase tracking-wider mb-2">Redes Compatibles</h2>
        <ul className="text-sm text-[hsl(var(--on-surface))] space-y-1">
          <li>• Laborum Chile</li>
          <li>• Trabajando.com</li>
          <li>• LinkedIn Jobs</li>
          <li>• ChileTrabajos</li>
          <li>• CompuTrabajo</li>
        </ul>
      </div>

      <button 
        onClick={handleOpenApp}
        className="w-full bg-[hsl(var(--surface-container-highest))] hover:bg-[hsl(var(--outline))] text-[hsl(var(--on-surface))] font-medium text-sm py-2 rounded flex items-center justify-center gap-2 transition-colors"
      >
        <ExternalLink size={16} /> Abrir Perfil Maestro
      </button>
    </div>
  );
}