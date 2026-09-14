'use client';

import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { KanbanBoard } from './components/kanban-board';
import { Button } from '@/components/ui/Button';

export default function MisPostulacionesPage() {
  const [searchQuery, setSearchQuery] = useState('');

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
          <Button variant="primary" className="gap-2 shrink-0">
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
          <Button variant="secondary" className="gap-2 w-full md:w-auto">
            <Filter size={18} /> Filtros
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <KanbanBoard searchQuery={searchQuery} />
      </div>
    </div>
  );
}