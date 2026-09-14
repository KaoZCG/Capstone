import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { Postulacion, PostulacionStatus } from '@/types';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  title: string;
  status: PostulacionStatus;
  postulaciones: Postulacion[];
  onDelete: (id: string) => void;
  onViewDetails: (postulacion: Postulacion) => void;
  onMove: (id: string, status: PostulacionStatus) => void;
}

export function KanbanColumn({ title, status, postulaciones, onDelete, onViewDetails, onMove }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className={`flex-shrink-0 w-[85vw] md:w-80 bg-surface-container-low rounded-container p-4 border transition-colors flex flex-col max-h-full ${
      isOver ? 'border-primary bg-primary-container/5' : 'border-border'
    }`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-label-md font-semibold text-on-surface uppercase tracking-wider">{title}</h3>
        <span className="text-label-sm text-on-surface bg-surface-container-highest px-2 py-0.5 rounded-pill font-medium">
          {postulaciones.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto space-y-3 min-h-[150px] hide-scrollbar pb-2">
        <SortableContext items={postulaciones.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {postulaciones.map((postulacion) => (
              <KanbanCard
                key={postulacion.id}
                postulacion={postulacion}
                onDelete={() => onDelete(postulacion.id)}
                onViewDetails={() => onViewDetails(postulacion)}
                onMove={(newStatus) => onMove(postulacion.id, newStatus)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </div>
    </div>
  );
}