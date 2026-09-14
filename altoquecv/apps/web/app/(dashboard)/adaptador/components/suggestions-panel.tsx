import React from 'react';
import { Sugerencia } from '@/types';
import { AlertTriangle, Info, Lightbulb, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function SuggestionsPanel({ sugerencias }: { sugerencias: Sugerencia[] }) {
  // Ordenar: críticas primero
  const sortedSugerencias = [...sugerencias].sort((a, b) => {
    const weights = { crítica: 3, importante: 2, mejora: 1 };
    return weights[b.tipo] - weights[a.tipo];
  });

  const getTypeStyles = (tipo: Sugerencia['tipo']) => {
    switch (tipo) {
      case 'crítica': return { icon: <AlertTriangle size={20} className="text-error" />, border: 'border-error/50 bg-error-container/5' };
      case 'importante': return { icon: <Info size={20} className="text-primary" />, border: 'border-primary/50 bg-primary-container/5' };
      case 'mejora': return { icon: <Lightbulb size={20} className="text-success" />, border: 'border-success/50 bg-success-container/5' };
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-headline-sm text-on-surface">Plan de Acción ({sugerencias.length})</h3>
      
      <div className="flex flex-col gap-4">
        {sortedSugerencias.map((sug) => {
          const style = getTypeStyles(sug.tipo);
          
          return (
            <div key={sug.id} className={`p-4 rounded-card border ${style.border} flex flex-col sm:flex-row gap-4 items-start`}>
              <div className="shrink-0 mt-1">{style.icon}</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-label-lg font-semibold text-on-surface">{sug.título}</h4>
                  <span className="text-label-sm font-bold text-success bg-success-container/20 px-2 py-0.5 rounded">
                    +{sug.impacto}% impacto
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant mb-3">{sug.descripción}</p>
                
                {sug.acción && (
                  <Button variant="secondary" className="h-8 text-label-sm gap-1">
                Aplicar corrección <ChevronRight size={14} />P
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}