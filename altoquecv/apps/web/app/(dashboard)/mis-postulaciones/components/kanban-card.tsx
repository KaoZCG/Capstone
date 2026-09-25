import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';
import { Postulacion, PostulacionStatus } from '@/types';
import { PostulacionMenu } from './postulacion-menu';

interface KanbanCardProps {
  postulacion: Postulacion;
  onDelete: () => void;
  onViewDetails: () => void;
  onMove: (status: PostulacionStatus) => void;
}

export function KanbanCard({ postulacion, onDelete, onViewDetails, onMove }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ 
    id: postulacion.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const getMatchColor = (score: number) => {
    if (score >= 85) return 'text-success bg-success-container/20';
    if (score >= 70) return 'text-primary bg-primary-container/20';
    return 'text-error bg-error-container/20';
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-surface-container-lowest border border-border rounded-card p-4 hover:border-primary/50 transition-colors shadow-sm relative group"
    >
      <div className="flex justify-between items-start mb-2">
        <div 
          className="flex-1 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <h4 className="text-label-md font-semibold text-on-surface line-clamp-1">{postulacion.empresa.nombre}</h4>
          <p className="text-label-sm text-on-surface-variant line-clamp-1">{postulacion.cargo}</p>
        </div>
        <div className="shrink-0 ml-2">
          <PostulacionMenu 
            postulacion={postulacion}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
            onMove={onMove}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-label-sm text-on-surface-variant">
          <MapPin size={12} />
          <span className="truncate max-w-[100px]">{postulacion.ubicacion}</span>
        </div>
        <span className={`text-label-sm font-semibold px-2 py-0.5 rounded-pill ${getMatchColor(postulacion.compatibilidad)}`}>
          {postulacion.compatibilidad}%
        </span>
      </div>
      
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1 text-label-sm text-on-surface-variant">
          <Calendar size={12} />
          {new Date(postulacion.fechaPostulacion).toLocaleDateString('es-CL')}
        </div>
      </div>
    </motion.div>
  );
}