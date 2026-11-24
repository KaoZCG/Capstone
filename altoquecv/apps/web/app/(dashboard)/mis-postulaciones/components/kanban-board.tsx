import React, { useState, type FormEvent } from 'react';
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

export function KanbanBoard({
  searchQuery = '',
  statusFilter = 'todas',
  isCreateOpen = false,
  onCloseCreate,
}: {
  searchQuery?: string;
  statusFilter?: PostulacionStatus | 'todas';
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}) {
  const { postulaciones, isLoading, error, movePostulacion, createPostulacion, deletePostulacion, search } = usePostulaciones();
  const [selectedPostulacion, setSelectedPostulacion] = useState<Postulacion | null>(null);
  const [newApplication, setNewApplication] = useState({
    cargo: '',
    empresa: '',
    url_oferta: '',
    tipo: 'laborum' as 'laborum' | 'trabajando',
  });
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
  const visibleStatuses = statusFilter === 'todas'
    ? statuses
    : statuses.filter((status) => status === statusFilter);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError('');
    setIsCreating(true);
    try {
      await createPostulacion(newApplication);
      setNewApplication({ cargo: '', empresa: '', url_oferta: '', tipo: 'laborum' });
      onCloseCreate?.();
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : 'No fue posible registrar la postulación.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-on-surface-variant">Cargando tablero...</div>;
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        {error && <p role="alert" className="mb-3 text-body-sm text-error">{error}</p>}
        <div className="flex gap-6 overflow-x-auto pb-4 h-full items-start snap-x snap-mandatory md:snap-none">
          {visibleStatuses.map((status) => (
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
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-postulation-title"
            onSubmit={(event) => void handleCreate(event)}
            className="w-full max-w-lg space-y-4 rounded-container border border-border bg-surface-container-lowest p-6 shadow-xl"
          >
            <h2 id="create-postulation-title" className="text-headline-sm text-on-surface">Nueva postulación</h2>
            <label className="block text-label-md text-on-surface">
              Cargo
              <input required maxLength={200} value={newApplication.cargo} onChange={(event) => setNewApplication((current) => ({ ...current, cargo: event.target.value }))} className="mt-1 w-full rounded-input border border-border bg-surface-container-low px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant" />
            </label>
            <label className="block text-label-md text-on-surface">
              Empresa
              <input required maxLength={200} value={newApplication.empresa} onChange={(event) => setNewApplication((current) => ({ ...current, empresa: event.target.value }))} className="mt-1 w-full rounded-input border border-border bg-surface-container-low px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant" />
            </label>
            <label className="block text-label-md text-on-surface">
              Tipo de portal
              <select
                value={newApplication.tipo}
                onChange={(event) => setNewApplication((current) => ({
                  ...current,
                  tipo: event.target.value as 'laborum' | 'trabajando',
                }))}
                className="mt-1 w-full rounded-input border border-border bg-surface-container-low px-3 py-2 text-body-md text-on-surface"
              >
                <option value="laborum">Laborum</option>
                <option value="trabajando">Trabajando</option>
              </select>
            </label>
            <label className="block text-label-md text-on-surface">
              Enlace https de la vacante
              <input required type="url" maxLength={2048} value={newApplication.url_oferta} onChange={(event) => setNewApplication((current) => ({ ...current, url_oferta: event.target.value }))} className="mt-1 w-full rounded-input border border-border bg-surface-container-low px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant" />
            </label>
            {createError && <p role="alert" className="text-body-sm text-error">{createError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" disabled={isCreating} onClick={onCloseCreate} className="rounded-button px-4 py-2 text-label-md text-on-surface hover:bg-surface-container-low">Cancelar</button>
              <button type="submit" disabled={isCreating} className="rounded-button bg-primary px-4 py-2 text-label-md font-semibold text-on-primary disabled:opacity-60">{isCreating ? 'Guardando…' : 'Guardar postulación'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}