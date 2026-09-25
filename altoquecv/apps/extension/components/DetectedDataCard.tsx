import React from 'react';
import { Check } from 'lucide-react';
import type { CompatibilidadWidget } from '../types/oferta';

export function DetectedDataCard({ datos }: { datos: CompatibilidadWidget['datosDetectados'] }) {
  return (
    <div className="border border-border rounded-md p-3 mb-5 bg-surface-container-lowest">
      <h4 className="text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">Datos Listos para Inyectar</h4>
      <ul className="space-y-2 text-sm text-on-surface">
        <li className="flex items-center gap-2">
          <Check size={14} className="text-success" /> 
          <span className="font-medium text-xs">RUT:</span> {datos.rut.valor}
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-success" /> 
          <span className="font-medium text-xs">Teléfono:</span> {datos.telefono.valor}
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-success" /> 
          <span className="font-medium text-xs">Renta:</span> ${datos.rentaPretendida.valor.toLocaleString('es-CL')}
        </li>
      </ul>
    </div>
  );
}