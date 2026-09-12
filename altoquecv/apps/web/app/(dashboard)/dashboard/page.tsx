import { dashboardStatsMock } from '@/lib/mock/dashboard.mock';
import { mockProfile } from '@/lib/mock/perfil-maestro.mock';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Briefcase, FileSearch, CalendarCheck, Target, Search, FileText, BarChart } from 'lucide-react';

export default function DashboardPage() {
  const firstName = mockProfile.personalData.fullName.split(' ')[0];
  const lastNameInitial = mockProfile.personalData.fullName.split(' ')[1]?.charAt(0);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <header>
        <h1 className="text-display-lg text-on-surface mb-2">
          Hola, {firstName} {lastNameInitial}.
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Aquí está el resumen de tu búsqueda laboral de esta semana.
        </p>
      </header>

      {/* Grid de Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-md">Postulaciones totales</span>
            <Briefcase size={20} />
          </div>
          <span className="text-display-lg text-on-surface">{dashboardStatsMock.totalPostulaciones}</span>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-md">CV en revisión</span>
            <FileSearch size={20} />
          </div>
          <span className="text-display-lg text-on-surface">{dashboardStatsMock.cvEnRevision}</span>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-md">Entrevistas agendadas</span>
            <CalendarCheck size={20} />
          </div>
          <span className="text-display-lg text-on-surface">{dashboardStatsMock.entrevistasAgendadas}</span>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-md">Compatibilidad prom.</span>
            <Target size={20} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-display-lg text-success">{dashboardStatsMock.compatibilidadPromedio}</span>
            <span className="text-headline-md text-success">%</span>
          </div>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <section>
        <h2 className="text-headline-md text-on-surface mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" className="gap-2">
            <Search size={18} />
            Buscar ofertas
          </Button>
          <Button variant="secondary" className="gap-2">
            <FileText size={18} />
            Revisar CV
          </Button>
          <Button variant="secondary" className="gap-2">
            <BarChart size={18} />
            Ver resultados
          </Button>
        </div>
      </section>
    </div>
  );
}