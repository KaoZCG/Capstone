'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, CheckCircle2, ExternalLink, MapPin, RefreshCw, Search, Sparkles, Trash2 } from 'lucide-react';
import { useOfertasLaborum } from '@/hooks/use-ofertas-laborum';
import { usePostulaciones } from '@/hooks/use-postulaciones';

function buildAdaptUrl(oferta: { titulo: string; empresa: string; notas_usuario: string }) {
  const params = new URLSearchParams({
    cargo: oferta.titulo,
    empresa: oferta.empresa,
    descripcion: oferta.notas_usuario,
  });
  return `/adaptador?${params.toString()}`;
}

function fechaCorta(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date);
}

export default function OfertasPage() {
  const { ofertas, isLoading, error, recargar, guardarOferta, eliminarOferta } = useOfertasLaborum();
  const { postulaciones, isLoading: cargandoPostulaciones, createPostulacion } = usePostulaciones();
  const [query, setQuery] = useState('');
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [nuevaOferta, setNuevaOferta] = useState({ titulo: '', empresa: '', ubicacion: '', url: '', notas_usuario: '' });
  const [guardandoOferta, setGuardandoOferta] = useState(false);
  const [registrandoUrl, setRegistrandoUrl] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');

  const ofertasFiltradas = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es-CL');
    return [...ofertas]
      .filter((oferta) => !normalizedQuery || `${oferta.titulo} ${oferta.empresa} ${oferta.ubicacion}`.toLocaleLowerCase('es-CL').includes(normalizedQuery))
      .sort((left, right) => right.compatibilidad - left.compatibilidad);
  }, [ofertas, query]);

  const quitarOferta = async (id: string) => {
    setEliminando(id);
    await eliminarOferta(id);
    setEliminando(null);
  };

  const guardarOfertaManual = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje('');
    let url: URL;
    try {
      url = new URL(nuevaOferta.url.trim());
    } catch {
      setMensaje('Ingresa una URL válida de una oferta de Laborum Chile.');
      return;
    }
    if (url.protocol !== 'https:' || !(url.hostname === 'laborum.cl' || url.hostname.endsWith('.laborum.cl')) || !url.pathname.startsWith('/empleos/')) {
      setMensaje('La URL debe ser una oferta de https://www.laborum.cl/empleos/.');
      return;
    }
    url.search = '';
    url.hash = '';

    setGuardandoOferta(true);
    const guardada = await guardarOferta({
      titulo: nuevaOferta.titulo.trim(),
      empresa: nuevaOferta.empresa.trim() || 'Confidencial',
      ubicacion: nuevaOferta.ubicacion.trim() || 'No informada',
      url: url.toString(),
      notas_usuario: nuevaOferta.notas_usuario.trim(),
    });
    if (guardada) {
      setNuevaOferta({ titulo: '', empresa: '', ubicacion: '', url: '', notas_usuario: '' });
      setMensaje('Oferta guardada. La compatibilidad usa solo el título y tus notas breves.');
    }
    setGuardandoOferta(false);
  };

  const registrarPostulacion = async (oferta: (typeof ofertas)[number]) => {
    if (!window.confirm('¿Ya enviaste el formulario de postulación en Laborum? Esto solo crea una tarjeta en AltoqueCV; no envía nada a Laborum.')) return;
    setRegistrandoUrl(oferta.url);
    setMensaje('');
    try {
      await createPostulacion({ cargo: oferta.titulo, empresa: oferta.empresa, url_oferta: oferta.url });
      setMensaje('Postulación registrada en tu Kanban.');
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo registrar la postulación.');
    } finally {
      setRegistrandoUrl(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-label-md font-semibold uppercase tracking-wide text-primary">
            <BriefcaseBusiness size={17} /> Laborum
          </p>
          <h1 className="text-display-md text-on-surface">Ofertas para tu perfil</h1>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
            Agrega los datos de una oferta que encontraste en Laborum y compáralos con tu Perfil Maestro.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void recargar()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-button border border-border px-4 py-2 text-label-md text-on-surface hover:bg-surface-container-low disabled:opacity-60">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Actualizar
          </button>
          <a href="https://www.laborum.cl/empleos-busqueda-empleos.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-button bg-primary px-4 py-2 text-label-md font-semibold text-on-primary hover:opacity-90">
            Abrir Laborum <ExternalLink size={16} />
          </a>
        </div>
      </header>

      <section className="rounded-container border border-border bg-surface-container-lowest p-5">
        <h2 className="text-headline-sm font-semibold text-on-surface">Agregar oferta manualmente</h2>
        <p className="mt-1 max-w-3xl text-body-sm text-on-surface-variant">
          AltoqueCV no lee ni importa automáticamente el contenido de Laborum. Ingresa el enlace y los datos básicos; si quieres, redacta un resumen breve con tus propias palabras (máximo 500 caracteres), sin copiar el aviso completo.
        </p>
        <p className="mt-1 text-body-sm text-on-surface-variant">Guarda la oferta antes de abrirla o recargarla para usar el análisis y el autocompletado de la extensión en esa vacante.</p>
        <form onSubmit={(event) => void guardarOfertaManual(event)} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-label-sm text-on-surface-variant">Cargo
            <input required maxLength={200} value={nuevaOferta.titulo} onChange={(event) => setNuevaOferta((current) => ({ ...current, titulo: event.target.value }))} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-on-surface" />
          </label>
          <label className="text-label-sm text-on-surface-variant">Empresa
            <input maxLength={200} value={nuevaOferta.empresa} onChange={(event) => setNuevaOferta((current) => ({ ...current, empresa: event.target.value }))} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-on-surface" />
          </label>
          <label className="text-label-sm text-on-surface-variant">Ubicación
            <input maxLength={200} value={nuevaOferta.ubicacion} onChange={(event) => setNuevaOferta((current) => ({ ...current, ubicacion: event.target.value }))} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-on-surface" />
          </label>
          <label className="text-label-sm text-on-surface-variant">Enlace de la oferta en Laborum
            <input required type="url" value={nuevaOferta.url} onChange={(event) => setNuevaOferta((current) => ({ ...current, url: event.target.value }))} placeholder="https://www.laborum.cl/empleos/..." className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-on-surface" />
          </label>
          <label className="text-label-sm text-on-surface-variant md:col-span-2">Resumen de requisitos con tus palabras
            <textarea maxLength={500} rows={3} value={nuevaOferta.notas_usuario} onChange={(event) => setNuevaOferta((current) => ({ ...current, notas_usuario: event.target.value }))} placeholder="Por ejemplo: pide SQL, experiencia con reportes y trabajo colaborativo." className="mt-1 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-on-surface" />
            <span className="mt-1 block text-xs">{nuevaOferta.notas_usuario.length}/500 caracteres</span>
          </label>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button type="submit" disabled={guardandoOferta} className="rounded-button bg-primary px-4 py-2 text-label-md font-semibold text-on-primary disabled:opacity-60">{guardandoOferta ? 'Guardando…' : 'Guardar oferta'}</button>
            {mensaje && <p role="status" className="text-body-sm text-on-surface-variant">{mensaje}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-container border border-border bg-surface-container-lowest p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label-md font-semibold text-on-surface">Cómo se calcula la compatibilidad</p>
            <p className="mt-1 max-w-3xl text-body-sm text-on-surface-variant">
              Usa habilidades (70%), experiencia (20%) y formación (10%). El cálculo solo considera el título y el resumen que ingresaste; es orientativo y no analiza el aviso completo. Si falta una sección en tu Perfil Maestro, su peso se reparte entre las disponibles.
            </p>
          </div>
          <label className="relative w-full sm:max-w-xs">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cargo o empresa" aria-label="Buscar ofertas" className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </label>
        </div>
      </section>

      {error && <p role="alert" className="rounded-md border border-error/30 bg-error-container/20 p-3 text-sm text-error">{error}</p>}

      {isLoading ? (
        <div className="rounded-container border border-border bg-surface-container-lowest p-10 text-center text-body-md text-on-surface-variant">Cargando ofertas guardadas...</div>
      ) : ofertasFiltradas.length === 0 ? (
        <section className="rounded-container border border-dashed border-border bg-surface-container-lowest px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/30 text-primary"><BriefcaseBusiness size={25} /></div>
          <h2 className="mt-4 text-headline-sm font-semibold text-on-surface">{ofertas.length ? 'No encontramos ofertas con esa búsqueda' : 'Todavía no hay ofertas guardadas'}</h2>
          <p className="mx-auto mt-2 max-w-xl text-body-md text-on-surface-variant">
            {ofertas.length
              ? 'Prueba con otro cargo, empresa o ubicación.'
              : 'Agrega una oferta manualmente con el formulario de arriba. No se importa información automáticamente desde Laborum.'}
          </p>
          {!ofertas.length && <a href="https://www.laborum.cl/empleos-busqueda-empleos.html" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-button bg-primary px-4 py-2.5 text-label-md font-semibold text-on-primary hover:opacity-90">Buscar en Laborum <ExternalLink size={16} /></a>}
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {ofertasFiltradas.map((oferta) => (
            <article key={oferta.id} className="rounded-container border border-border bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-label-sm text-on-surface-variant">{oferta.empresa}</p>
                  <h2 className="mt-1 text-headline-sm font-semibold text-on-surface">{oferta.titulo}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-body-sm text-on-surface-variant"><MapPin size={15} />{oferta.ubicacion}</p>
                </div>
                <div className="shrink-0 rounded-xl bg-primary-container/30 px-3 py-2 text-center text-primary">
                  <span className="block text-headline-sm font-bold">{oferta.compatibilidad}%</span>
                  <span className="text-[11px] font-medium">match</span>
                </div>
              </div>

              <p className="mt-4 line-clamp-4 whitespace-pre-line text-body-sm text-on-surface-variant">
                {oferta.notas_usuario || 'No agregaste notas sobre los requisitos. Abre la oferta original en Laborum para revisarla.'}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-surface-container-low px-3 py-2 text-center text-label-sm">
                <div><span className="block text-on-surface-variant">Habilidades</span><span className="font-semibold text-on-surface">{oferta.skills_match}%</span></div>
                <div><span className="block text-on-surface-variant">Experiencia</span><span className="font-semibold text-on-surface">{oferta.experiencia_match}%</span></div>
                <div><span className="block text-on-surface-variant">Formación</span><span className="font-semibold text-on-surface">{oferta.formacion_match}%</span></div>
              </div>
              <div className="mt-2 text-label-sm text-on-surface-variant">
                Habilidades coincidentes: <span className="font-semibold text-on-surface">{oferta.habilidades_coincidentes.length} de {oferta.habilidades_totales}</span>
                {oferta.habilidades_coincidentes.length > 0 && <p className="mt-1 truncate">{oferta.habilidades_coincidentes.join(', ')}</p>}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-label-sm text-on-surface-variant">Vista el {fechaCorta(oferta.fecha_captura)}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={buildAdaptUrl(oferta)} className="inline-flex items-center gap-1.5 rounded-button bg-primary px-3 py-2 text-label-sm font-semibold text-on-primary hover:opacity-90"><Sparkles size={15} /> Adaptar CV</Link>
                  <a href={oferta.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-2 text-label-sm text-on-surface hover:bg-surface-container-low">Ver oferta <ExternalLink size={15} /></a>
                  {postulaciones.some((item) => item.url_oferta === oferta.url) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-2 text-label-sm text-on-surface-variant"><CheckCircle2 size={15} /> En Kanban</span>
                  ) : (
                    <button type="button" onClick={() => void registrarPostulacion(oferta)} disabled={cargandoPostulaciones || registrandoUrl === oferta.url} title="Solo registra la tarjeta; no envía una postulación a Laborum" className="inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-2 text-label-sm text-on-surface hover:bg-surface-container-low disabled:opacity-50">
                      {registrandoUrl === oferta.url ? 'Registrando…' : 'Ya postulé · crear tarjeta'}
                    </button>
                  )}
                  <button type="button" onClick={() => void quitarOferta(oferta.id)} disabled={eliminando === oferta.id} aria-label={`Quitar ${oferta.titulo}`} title="Quitar oferta guardada" className="inline-flex items-center justify-center rounded-button border border-border px-3 py-2 text-on-surface-variant hover:bg-error-container/20 hover:text-error disabled:opacity-50"><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
