import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { CompatibilidadWidget } from '../types/oferta';

export function FieldMappingStatus({ mapeo }: { mapeo: CompatibilidadWidget['mapeoCampos'] }) {
  return (
    <div className="flex items-center justify-between p-3 bg-success-container border border-success/20 rounded-md mb-4">
      <div className="flex items-center gap-2 text-sm text-on-success-container font-medium">
        <CheckCircle2 size={16} className="text-success" />
        Mapeo Automático
      </div>
      <span className="text-xs font-bold text-success bg-surface-container-lowest px-2 py-0.5 rounded-full">
        {mapeo.completados} de {mapeo.total} listos
      </span>
    </div>
  );
}