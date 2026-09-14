import React from 'react';
import { CompatibilidadComparativa } from '@/types';
import { Trophy, Users } from 'lucide-react';

export function ComparadorATS({ comparativa }: { comparativa: CompatibilidadComparativa }) {
  return (
    <div className="bg-surface-container-lowest rounded-container border border-border p-6 flex flex-col justify-between">
      <h3 className="text-headline-sm text-on-surface mb-6">Competencia</h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-label-sm mb-2">
            <span className="text-on-surface flex items-center gap-2"><Trophy size={14} className="text-primary"/> Tu CV ({comparativa.cvActual}%)</span>
            <span className="text-on-surface-variant flex items-center gap-2">Promedio ({comparativa.promedioPortal}%) <Users size={14}/></span>
          </div>
          
          {/* Barra apilada simulada */}
          <div className="relative h-3 bg-surface-container-highest rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-outline-variant"
              style={{ width: `${comparativa.promedioPortal}%` }}
            />
            <div 
              className="absolute top-0 left-0 h-full bg-primary"
              style={{ width: `${comparativa.cvActual}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-label-sm text-on-surface-variant">Rango del mercado</p>
            <p className="text-label-lg font-semibold text-on-surface">{comparativa.rango.min}% - {comparativa.rango.max}%</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Tu posición</p>
            <p className="text-label-lg font-semibold text-success">Top {100 - comparativa.percentil}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}