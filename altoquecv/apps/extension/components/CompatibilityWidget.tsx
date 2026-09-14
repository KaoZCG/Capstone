import React, { useState } from 'react';
import { X, Wand2, ExternalLink } from 'lucide-react';
import type { OfertaDetectada, CompatibilidadWidget as ICompatibilidadWidget } from '../types/oferta';
import { ScoreGauge } from './ScoreGauge';
import { ScoreBreakdown } from './ScoreBreakdown';
import { FieldMappingStatus } from './FieldMappingStatus';
import { DetectedDataCard } from './DetectedDataCard';

interface Props {
  oferta: OfertaDetectada;
  compatibilidad: ICompatibilidadWidget;
  onClose: () => void;
}

export function CompatibilityWidget({ oferta, compatibilidad, onClose }: Props) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleAutoFill = () => {
    setToastMsg("¡Formulario autocompletado! (Mock)");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAdaptCV = () => {
    window.open('http://localhost:3000/adaptador', '_blank');
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] w-[340px] bg-surface rounded-lg shadow-2xl border border-border overflow-hidden font-sans">
      {toastMsg && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-success text-white text-xs px-3 py-1 rounded-full z-10 shadow-md">
          {toastMsg}
        </div>
      )}

      <div className="bg-surface-container-lowest p-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-primary text-white rounded font-bold text-xs flex items-center justify-center">A</div>
          <span className="text-sm font-semibold text-on-surface">AltoqueCV</span>
          <span className="text-[10px] bg-primary-container text-white px-1.5 py-0.5 rounded capitalize">
            {oferta.portal}
          </span>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-error">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 bg-surface-container-low">
        <h3 className="text-sm font-bold text-on-surface mb-4 text-center">Compatibilidad ATS</h3>
        
        <div className="flex items-center gap-4 mb-5">
          <ScoreGauge score={compatibilidad.scoreGeneral} />
          <ScoreBreakdown desglose={compatibilidad.desglose} />
        </div>

        <FieldMappingStatus mapeo={compatibilidad.mapeoCampos} />
        <DetectedDataCard datos={compatibilidad.datosDetectados} />

        <div className="flex flex-col gap-2 mt-2">
          <button onClick={handleAutoFill} className="w-full bg-primary hover:opacity-90 text-white font-medium text-sm py-2 rounded flex items-center justify-center gap-2 transition-colors">
            <Wand2 size={16} /> Autocompletar Formulario
          </button>
          
          <button onClick={handleAdaptCV} className="w-full bg-surface-container-highest hover:bg-outline text-on-surface font-medium text-sm py-2 rounded flex items-center justify-center gap-2 transition-colors">
            <ExternalLink size={16} /> Adaptar CV a esta oferta
          </button>
        </div>
      </div>
    </div>
  );
}