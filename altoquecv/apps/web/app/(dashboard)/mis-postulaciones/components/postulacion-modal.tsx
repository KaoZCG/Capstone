import React from 'react';
import { X, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { Postulacion } from '@/types';
import { Button } from '@/components/ui/Button';

interface ModalProps {
  postulacion: Postulacion;
  onClose: () => void;
}

export function PostulacionModal({ postulacion, onClose }: ModalProps) {
  const getMatchColor = (score: number) => {
    if (score >= 85) return 'text-success bg-success-container/20';
    if (score >= 70) return 'text-primary bg-primary-container/20';
    return 'text-error bg-error-container/20';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-container border border-border shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-start p-6 border-b border-border bg-surface-container-low">
          <div>
            <h2 className="text-headline-sm text-on-surface mb-1">{postulacion.cargo}</h2>
            <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
              <span className="font-semibold">{postulacion.empresa.nombre}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {postulacion.ubicacion}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between p-4 bg-surface-container rounded-card border border-outline-variant">
            <div>
              <p className="text-label-sm text-on-surface-variant mb-1">Compatibilidad con tu Perfil</p>
              <h3 className={`text-headline-md inline-block px-3 py-1 rounded-pill ${getMatchColor(postulacion.compatibilidad)}`}>
                {postulacion.compatibilidad}% Match
              </h3>
            </div>
            <div className="text-right">
              <p className="text-label-sm text-on-surface-variant mb-1">Fecha Postulación</p>
              <p className="flex items-center gap-2 justify-end text-label-md text-on-surface">
                <Calendar size={14} /> 
                {new Date(postulacion.fechaPostulacion).toLocaleDateString('es-CL')}
              </p>
            </div>
          </div>

          {postulacion.competenciasCubiertas && (
            <div>
              <h4 className="text-label-lg text-on-surface mb-3">Competencias Destacadas</h4>
              <div className="flex flex-wrap gap-2">
                {postulacion.competenciasCubiertas.map((comp) => (
                  <span key={comp} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container/10 text-primary border border-primary/20 rounded-pill text-label-sm">
                    <CheckCircle2 size={14} /> {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {postulacion.proximoPaso && (
            <div>
              <h4 className="text-label-lg text-on-surface mb-2">Estado Actual / Próximo Paso</h4>
              <p className="text-body-md text-on-surface-variant bg-surface-container p-3 rounded-input border border-border">
                {postulacion.proximoPaso}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-surface-container-low flex justify-end gap-3 shrink-0">
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button variant="primary">Actualizar Estado</Button>
        </div>
      </div>
    </div>
  );
}