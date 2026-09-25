import React from 'react';
import { MoreVertical, Calendar, Building2, MapPin } from 'lucide-react';
import { Postulacion } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

interface KanbanCardProps {
  postulacion: Postulacion;
  onMove?: (nuevoStatus: string) => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
}

export function KanbanCard({ postulacion }: KanbanCardProps) {
  const getMatchColor = (score: number) => {
    if (score >= 85) return 'text-success bg-success-container/20';
    if (score >= 70) return 'text-primary bg-primary-container/20';
    return 'text-error bg-error-container/20';
  };

  const formattedDate = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(postulacion.fechaPostulacion));

  return (
    <Card className="p-4 flex flex-col gap-3 group relative cursor-pointer hover:border-primary transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-3">
          <Avatar src={postulacion.empresa.logo} alt={postulacion.empresa.nombre} size="sm" />
          <div>
            <h4 className="text-label-md text-on-surface line-clamp-1" title={postulacion.cargo}>
              {postulacion.cargo}
            </h4>
            <div className="flex items-center gap-1 text-label-sm text-on-surface-variant mt-0.5">
              <Building2 size={12} />
              <span className="line-clamp-1">{postulacion.empresa.nombre}</span>
            </div>
          </div>
        </div>
        <button className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
        <MapPin size={12} />
        <span className="truncate">{postulacion.ubicacion}</span>
      </div>

      <div className="flex items-center justify-between mt-2 pt-3 border-t border-border">
        <div className={`px-2 py-0.5 rounded text-label-sm font-semibold ${getMatchColor(postulacion.compatibilidad)}`}>
          {postulacion.compatibilidad}% Match
        </div>
        <div className="flex items-center gap-1 text-label-sm text-on-surface-variant">
          <Calendar size={12} />
          <span>{formattedDate}</span>
        </div>
      </div>

      {postulacion.proximoPaso && (
        <div className="mt-1 bg-surface-container-low p-2 rounded-input text-label-sm text-on-surface-variant border border-outline-variant">
          <span className="font-semibold text-on-surface">Próximo paso:</span> {postulacion.proximoPaso}
        </div>
      )}
    </Card>
  );
}