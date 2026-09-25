import React from 'react';
import { Postulacion, PostulacionStatus } from '@/types';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  title: string;
  status: PostulacionStatus;
  postulaciones: Postulacion[];
}

export function KanbanColumn({ title, status, postulaciones }: KanbanColumnProps) {
  const columnPostulaciones = postulaciones.filter((p) => p.status === status);

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px] bg-surface-container-lowest border border-border rounded-container h-full max-h-full">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface-container-low rounded-t-container shrink-0">
        <h3 className="text-label-md font-semibold text-on-surface uppercase tracking-wider">
          {title}
        </h3>
        <span className="bg-surface-container-highest text-on-surface text-label-sm px-2 py-0.5 rounded-pill font-medium">
          {columnPostulaciones.length}
        </span>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {columnPostulaciones.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-label-sm text-on-surface-variant border-2 border-dashed border-border rounded-card">
            Sin postulaciones
          </div>
        ) : (
          columnPostulaciones.map((postulacion) => (
            <KanbanCard key={postulacion.id} postulacion={postulacion} />
          ))
        )}
      </div>
    </div>
  );
}