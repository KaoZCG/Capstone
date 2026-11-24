'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/use-auth';
import { usePostulaciones } from '@/hooks/use-postulaciones';
import { useProfile } from '@/hooks/use-profile';
import { usePortales } from '@/hooks/use-portales';
import { useSyncConsole } from '@/hooks/use-sync-console';
import {
  BarChart,
  Briefcase,
  FileText,
  Globe2,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Search,
  Target,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const isPremium = usuario?.subscription_plan === 'premium';
  const { postulaciones, isLoading: isLoadingApplications, error: applicationsError } = usePostulaciones();
  const { profile, isLoading: isLoadingProfile, error: profileError } = useProfile();
  const { portales } = usePortales();
  const { sincronizarAhora } = useSyncConsole();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const postulacionesActivas = postulaciones.filter((postulacion) =>
    ['postulada', 'cv-en-revision', 'entrevista-agendada', 'oferta-negociacion'].includes(postulacion.status),
  ).length;
  const compatibilidadPromedio = postulaciones.length === 0
    ? 0
    : Math.round(postulaciones.reduce((total, postulacion) => total + postulacion.compatibilidad, 0) / postulaciones.length);
  const postulacionesConRespuesta = postulaciones.filter((postulacion) => postulacion.status !== 'postulada').length;
  const tasaRespuesta = postulaciones.length
    ? Math.round((postulacionesConRespuesta / postulaciones.length) * 100)
    : 0;
  const portalesConectados = portales.filter((portal) => portal.conectado).length;
  const completionFields = profile ? [
    Boolean(`${profile.first_name} ${profile.last_name}`.trim()),
    Boolean(profile.email.trim()),
    Boolean(profile.rut.trim()),
    Boolean(profile.phone?.trim()),
    Boolean(profile.cargo_objetivo.trim()),
    Boolean(profile.region.trim()),
    Boolean(profile.comuna.trim()),
    Boolean(profile.linkedin.trim() || profile.portafolio.trim()),
    Boolean(profile.resumen_profesional.trim()),
    profile.education.length > 0,
    profile.experience.length > 0,
    profile.skills.length > 0,
  ] : [];
  const profileCompletion = completionFields.length
    ? Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100)
    : 0;
  const nameParts = (usuario?.nombre ?? 'Usuario').split(' ');
  const firstName = nameParts[0] ?? 'Usuario';
  const lastNameInitial = nameParts[1]?.charAt(0) ?? '';

  const handleSyncPortals = async () => {
    const connectedPortals = portales.filter((portal) => portal.conectado);
    if (connectedPortals.length === 0) {
      setSyncMessage('No hay portales conectados. Configúralos antes de iniciar la sincronización.');
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Iniciando la demostración de sincronización...');
    try {
      for (const portal of connectedPortals) {
        await sincronizarAhora(portal.id);
      }
      setSyncMessage('La demostración terminó. La sincronización real con los portales aún no está habilitada.');
    } catch (error) {
      setSyncMessage(error instanceof Error
        ? `No se pudo iniciar la sincronización: ${error.message}`
        : 'No se pudo iniciar la sincronización.');
    } finally {
      setIsSyncing(false);
    }
  };

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

      {/* Indicadores del proceso de búsqueda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-md">Postulaciones activas</span>
            <Briefcase size={20} />
          </div>
          <span className="text-display-lg text-on-surface">
          {!isPremium ? '—' : isLoadingApplications ? '…' : applicationsError ? '—' : postulacionesActivas}
          </span>
          {!isPremium && <span className="text-label-sm text-on-surface-variant">Disponible en plan Premium</span>}
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-md">Match ATS promedio</span>
            <Target size={20} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-display-lg text-success">
              {!isPremium ? '—' : isLoadingApplications ? '…' : applicationsError ? '—' : compatibilidadPromedio}
            </span>
            {isPremium && !isLoadingApplications && !applicationsError && <span className="text-headline-md text-success">%</span>}
          </div>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-md">Tasa de respuesta</span>
            <MessageCircle size={20} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-display-lg text-on-surface">
              {!isPremium ? '—' : isLoadingApplications ? '…' : applicationsError ? '—' : tasaRespuesta}
            </span>
            {isPremium && !isLoadingApplications && !applicationsError && <span className="text-headline-md text-on-surface">%</span>}
          </div>
          <span className="text-label-sm text-on-surface-variant">Postulaciones que avanzaron más allá de “Postulada”</span>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-label-md">Portales habilitados</span>
            <Globe2 size={20} />
          </div>
          <span className="text-display-lg text-on-surface">{portalesConectados}</span>
          <Link href="/configuracion" className="text-label-sm font-semibold text-primary underline">
            Administrar portales
          </Link>
        </Card>
      </div>

      {applicationsError && (
        <p role="alert" className="text-body-sm text-error">
          No se pudieron cargar las postulaciones: {applicationsError}
        </p>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-headline-md text-on-surface">Completitud del Perfil Maestro</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {isLoadingProfile
                ? 'Consultando el perfil...'
                : profile
                  ? 'Completa estos datos para mejorar tu compatibilidad con las ofertas.'
                  : 'Inicia sesión y completa tu Perfil Maestro para ver el progreso.'}
            </p>
          </div>
          <span className="text-headline-md font-semibold text-on-surface">
            {isLoadingProfile ? '…' : profile ? `${profileCompletion}%` : '—'}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Completitud del Perfil Maestro"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={profile ? profileCompletion : 0}
          className="h-3 overflow-hidden rounded-pill bg-surface-container-highest"
        >
          <div
            className="h-full rounded-pill bg-primary transition-[width]"
            style={{ width: `${profile ? profileCompletion : 0}%` }}
          />
        </div>
        {profileError && (
          <p role="alert" className="text-body-sm text-error">
            No se pudo cargar el Perfil Maestro: {profileError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleSyncPortals} disabled={isSyncing}>
            <span className="flex items-center gap-2">
              {isSyncing ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {isSyncing ? 'Sincronizando...' : 'Sincronizar portales'}
            </span>
          </Button>
          {syncMessage && <p role="status" className="text-body-sm text-on-surface-variant">{syncMessage}</p>}
        </div>
      </Card>

      {/* Acciones Rápidas */}
      <section>
        <h2 className="text-headline-md text-on-surface mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/ofertas" className="inline-flex items-center justify-center gap-2 rounded-button bg-primary px-4 py-2 text-label-md text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container">
            <Search size={18} />
            Buscar ofertas
          </Link>
          <Link href="/adaptador" className="inline-flex items-center justify-center gap-2 rounded-button bg-surface-container-high px-4 py-2 text-label-md text-on-surface transition-colors hover:bg-surface-container-highest">
            <FileText size={18} />
            Revisar CV
          </Link>
          {isPremium && (
            <Link href="/mis-postulaciones" className="inline-flex items-center justify-center gap-2 rounded-button bg-surface-container-high px-4 py-2 text-label-md text-on-surface transition-colors hover:bg-surface-container-highest">
              <BarChart size={18} />
              Ver resultados
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
