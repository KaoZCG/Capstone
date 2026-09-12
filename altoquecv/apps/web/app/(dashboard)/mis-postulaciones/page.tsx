import { Filter, SlidersHorizontal } from 'lucide-react';
import { postulacionesMock } from '@/lib/mock/postulaciones.mock';
import { KanbanColumn } from '@/components/kanban/kanban-column';
import { Button } from '@/components/ui/Button';

export default function MisPostulacionesPage() {
  const tabs = ['Todos', 'LinkedIn', 'Laborum', 'Trabajando.com', 'GetOnBoard'];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      
      {/* Header Fijo */}
      <header className="shrink-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-headline-lg-mobile sm:text-headline-lg text-on-surface mb-2">Mis Postulaciones</h1>
            <p className="text-body-md text-on-surface-variant">
              Gestiona tu embudo. <span className="font-semibold text-primary">38.4%</span> tasa de respuesta general.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="gap-2">
              <Filter size={18} />
              Filtrar
            </Button>
            <Button variant="primary" className="gap-2">
              Nueva Postulación
            </Button>
          </div>
        </div>

        {/* Mock Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border hide-scrollbar">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              className={`px-4 py-2 text-label-md whitespace-nowrap border-b-2 transition-colors ${
                idx === 0 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Tablero Kanban Scrollable */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 h-full pb-4">
          <KanbanColumn 
            title="Postuladas" 
            status="postulada" 
            postulaciones={postulacionesMock} 
          />
          <KanbanColumn 
            title="CV en Revisión" 
            status="cv-en-revision" 
            postulaciones={postulacionesMock} 
          />
          <KanbanColumn 
            title="Entrevista Agendada" 
            status="entrevista-agendada" 
            postulaciones={postulacionesMock} 
          />
          <KanbanColumn 
            title="Ofertas / Negociación" 
            status="oferta-negociacion" 
            postulaciones={postulacionesMock} 
          />
        </div>
      </div>
    </div>
  );
}