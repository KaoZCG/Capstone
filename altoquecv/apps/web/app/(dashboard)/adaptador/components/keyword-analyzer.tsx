import React from 'react';
import { ATSAnalysis } from '@/types';
import { Check, X, AlertCircle } from 'lucide-react';

interface KeywordAnalyzerProps {
  keywords: ATSAnalysis['keywords'];
}

export function KeywordAnalyzer({ keywords }: KeywordAnalyzerProps) {
  return (
    <div className="bg-surface-container-lowest rounded-container border border-border p-6">
      <h3 className="text-headline-sm text-on-surface mb-6">Análisis de Keywords</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Encontradas */}
        <div>
          <h4 className="flex items-center gap-2 text-label-md text-success mb-3">
            <Check size={16} /> Encontradas ({keywords.encontradas.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {keywords.encontradas.map(kw => (
              <span key={kw} className="px-3 py-1 bg-success-container/20 text-success border border-success/20 rounded-pill text-label-sm">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Faltantes críticas */}
        <div>
          <h4 className="flex items-center gap-2 text-label-md text-error mb-3">
            <X size={16} /> Faltantes ({keywords.faltantes.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {keywords.faltantes.map(kw => (
              <span key={kw} className="px-3 py-1 bg-error-container/20 text-error border border-error/20 rounded-pill text-label-sm">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Recomendadas */}
        <div>
          <h4 className="flex items-center gap-2 text-label-md text-primary mb-3">
            <AlertCircle size={16} /> Recomendadas ({keywords.recomendadas.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {keywords.recomendadas.map(kw => (
              <span key={kw} className="px-3 py-1 bg-primary-container/20 text-primary border border-primary/20 rounded-pill text-label-sm">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}