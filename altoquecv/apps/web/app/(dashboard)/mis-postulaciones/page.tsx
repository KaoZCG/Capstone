'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { KanbanBoard } from './components/kanban-board';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/use-auth';
import type { PostulacionStatus } from '@/types';

const statusOptions: { value: PostulacionStatus | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas las postulaciones' },
  { value: 'postulada', label: 'Postuladas' },
  { value: 'cv-en-revision', label: 'CV en revisión' },
  { value: 'entrevista-agendada', label: 'Entrevista agendada' },
  { value: 'oferta-negociacion', label: 'Ofertas / negociación' },
];

export default function MisPostulacionesPage({
  searchParams,
}: {
  searchParams?: { buscar?: string };
}) {
  const initialQuery = searchParams?.buscar ?? '';
  const { usuario } = useAuth();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<PostulacionStatus | 'todas'>('todas');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => setSearchQuery(initialQuery), [initialQuery]);

  if (usuario?.subscription_plan !== 'premium') {
    return (
      <section className="mx-auto max-w-2xl rounded-container border border-border bg-surface-container-lowest p-8 text-center">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface">Tablero de postulaciones Premium</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          El plan Free permite generar respuestas de IA para hasta 5 vacantes distintas al día.
          El tablero Kanban está disponible al activar Premium.
        </p>
        <p className="mt-4 text-label-sm text-on-surface-variant">
          Para consultar la activación de Premium, contacta a la administración de AltoqueCV.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <header className="shrink-0 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">Mis Postulaciones</h1>
            <p className="text-body-md text-on-surface-variant">
              Arrastra las tarjetas para actualizar el estado de tu embudo.
            </p>
          </div>
          <Button variant="primary" className="gap-2 shrink-0" onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} /> Nueva Postulación
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              type="text"
              placeholder="Buscar por empresa o cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-input bg-surface-container text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="relative w-full md:w-auto">
            <Button type="button" variant="secondary" className="gap-2 w-full md:w-auto" aria-expanded={isFilterOpen} onClick={() => setIsFilterOpen((open) => !open)}>
              <Filter size={18} /> Filtros
            </Button>
            {isFilterOpen && (
              <div className="absolute right-0 z-20 mt-2 w-full min-w-56 rounded-card border border-border bg-surface-container-lowest p-2 shadow-lg">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setStatusFilter(option.value); setIsFilterOpen(false); }}
                    className={`block w-full rounded-input px-3 py-2 text-left text-label-sm ${statusFilter === option.value ? 'bg-primary-container/20 text-primary' : 'text-on-surface hover:bg-surface-container-low'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <KanbanBoard
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          isCreateOpen={isCreateOpen}
          onCloseCreate={() => setIsCreateOpen(false)}
        />
      </div>
    </div>
  );
}