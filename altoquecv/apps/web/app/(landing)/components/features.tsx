import React from 'react';
import { BrainCircuit, FileSignature, Zap, RefreshCw } from 'lucide-react';

export function Features() {
  const features = [
    { icon: BrainCircuit, title: "Análisis ATS en tiempo real", desc: "El widget evalúa tu perfil contra cualquier oferta laboral antes de que postules." },
    { icon: FileSignature, title: "Optimización automática", desc: "El motor de IA ajusta tu CV resaltando la experiencia exacta que busca el reclutador." },
    { icon: Zap, title: "Autocompletado inteligente", desc: "Rellena formularios tediosos de portales de empleo en un solo clic, sin equivocaciones." },
    { icon: RefreshCw, title: "Sincronización multiportal", desc: "Funciona nativamente sobre Laborum, Trabajando.com, LinkedIn, ChileTrabajos y CompuTrabajo." },
  ];

  return (
    <section id="caracteristicas" className="py-24 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-on-surface mb-4">La ventaja injusta en tu búsqueda laboral</h2>
          <p className="text-on-surface-variant text-lg">Automatiza el trabajo manual y asegura que tu currículum siempre pase el primer filtro robótico.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 p-6 rounded-2xl border border-border bg-surface-container-lowest hover:border-primary/40 transition-colors shadow-sm">
              <div className="shrink-0 w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center text-primary">
                <f.icon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">{f.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}