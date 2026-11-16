import React from 'react';
import { CheckCircle2, IdCard, Phone, Wallet } from 'lucide-react';
import type { WidgetProfileData } from '../types/oferta';

interface Props {
  profile: WidgetProfileData | null;
  detectedFieldCount: number;
  aiResponseStatus: string;
  loading: boolean;
}

export function DetectedDataCard({
  profile,
  detectedFieldCount,
  aiResponseStatus,
  loading,
}: Props) {
  const salary = profile?.salary_min == null
    ? 'No especificada'
    : `CLP $${profile.salary_min.toLocaleString('es-CL')}`;

  return (
    <div className="border border-border rounded-xl p-4 mb-5 bg-gradient-to-br from-surface-container-lowest to-surface-container-low shadow-sm">
      <div className="mb-3.5">
        <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-success" />
          Mapeo Automático de Datos
        </h4>
        <p className="mt-1 text-xs text-on-surface-variant" role="status" aria-live="polite">
          Campos detectados por AltoqueCV: {detectedFieldCount}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        <div className="flex items-center justify-between gap-3 bg-surface rounded-lg p-2.5 border border-border/50">
          <span className="flex items-center gap-2.5 text-on-surface-variant">
            <IdCard size={15} />
            <span className="font-medium text-xs">RUT</span>
          </span>
          <span className="text-xs font-bold text-on-surface text-right">
            {loading ? 'Cargando...' : profile?.rut?.trim() || 'No registrado'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 bg-surface rounded-lg p-2.5 border border-border/50">
          <span className="flex items-center gap-2.5 text-on-surface-variant">
            <Phone size={15} />
            <span className="font-medium text-xs">Teléfono</span>
          </span>
          <span className="text-xs font-bold text-on-surface text-right">
            {loading ? 'Cargando...' : profile?.phone?.trim() || 'No registrado'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 bg-surface rounded-lg p-2.5 border border-border/50">
          <span className="flex items-center gap-2.5 text-on-surface-variant">
            <Wallet size={15} />
            <span className="font-medium text-xs">Renta pretendida</span>
          </span>
          <span className="text-xs font-bold text-on-surface text-right">
            {loading ? 'Cargando...' : salary}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 bg-surface rounded-lg p-2.5 border border-border/50">
          <span className="font-medium text-xs text-on-surface-variant">Respuesta IA</span>
          <span className="text-xs font-bold text-on-surface text-right">{aiResponseStatus}</span>
        </div>
      </div>
    </div>
  );
}
