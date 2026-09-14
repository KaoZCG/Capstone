import React, { useState } from 'react';
import { DndContext, closestCorners, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Postulacion, PostulacionStatus } from '@/types';
import { usePostulaciones } from '@/hooks/use-postulaciones';
import { KanbanColumn } from './kanban-column';
import { PostulacionModal } from './postulacion-modal';

const statuses: PostulacionStatus[] = [
  'postulada',
  'cv-en-revision',
  'entrevista-agendada',
  'oferta-negociacion',
];

const statusLabels: Record<PostulacionStatus, string> = {
  postulada: 'Postuladas',
  'cv-en-revision': 'CV en Revisión',
  'entrevista-agendada': 'Entrevista Agendada',
  'oferta-negociacion': 'Ofertas / Negociación',
};

export function KanbanBoard({ searchQuery = '' }: { searchQuery?: string }) {
  const { postulaciones, isLoading, movePostulacion, deletePostulacion, search } = usePostulaciones();
  const [selectedPostulacion, setSelectedPostulacion] = useState<Postulacion | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Evita que clicks simples disparen el drag
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const postulacion = postulaciones.find((p) => p.id === active.id);
    if (postulacion && statuses.includes(over.id as PostulacionStatus) && postulacion.status !== over.id) {
      movePostulacion(postulacion.id, over.id as PostulacionStatus);
    }
  };

  const filteredPostulaciones = search(searchQuery);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-on-surface-variant">Cargando tablero...</div>;
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 h-full items-start snap-x snap-mandatory md:snap-none">
          {statuses.map((status) => (
            <div key={status} className="snap-center h-full">
              <KanbanColumn
                title={statusLabels[status]}
                status={status}
                postulaciones={filteredPostulaciones.filter((p) => p.status === status)}
                onDelete={deletePostulacion}
                onViewDetails={setSelectedPostulacion}
                onMove={movePostulacion}
              />
            </div>
          ))}
        </div>
      </DndContext>

      {selectedPostulacion && (
        <PostulacionModal 
          postulacion={selectedPostulacion} 
          onClose={() => setSelectedPostulacion(null)} 
        />
      )}
    </>
  );
}