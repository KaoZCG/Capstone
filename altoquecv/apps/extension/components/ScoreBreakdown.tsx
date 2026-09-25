import React from 'react';
import type { CompatibilidadWidget } from '../types/oferta';

export function ScoreBreakdown({ desglose }: { desglose: CompatibilidadWidget['desglose'] }) {
  return (
    <div className="space-y-3 flex-1 text-sm text-on-surface">
      <div>
        <div className="flex justify-between mb-1 text-xs">
          <span>Skills Técnicos</span>
          <span className="font-semibold text-success">{desglose.skillsTecnicos}%</span>
        </div>
        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-success rounded-full" style={{ width: `${desglose.skillsTecnicos}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1 text-xs">
          <span>Nivel Experiencia</span>
          <span className="font-semibold text-primary">{desglose.nivelExperiencia}/100</span>
        </div>
        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${desglose.nivelExperiencia}%` }} />
        </div>
      </div>
    </div>
  );
}