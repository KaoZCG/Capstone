'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react';
import { ATSScoreGauge } from './ats-score-gauge';
import { CVEditor } from './cv-editor';
import { CVPreview } from './cv-preview';
import { KeywordAnalyzer } from './keyword-analyzer';
import { useCVAnalyzer } from '@/hooks/use-cv-analyzer';
import { useAuth } from '@/hooks/use-auth';
import { CV } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
const inputClass = 'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

interface AdaptedExperience {
  indice: number;
  logros: string[];
  habilidades: string[];
}

interface AdaptedCVResponse {
  exito: boolean;
  resumen: string;
  experiencias: AdaptedExperience[];
  habilidades: string[];
}

const stopwords = new Set([
  'para', 'desde', 'sobre', 'entre', 'hasta', 'como', 'donde', 'cuando', 'quien',
  'con', 'sin', 'una', 'uno', 'unas', 'unos', 'las', 'los', 'del', 'por', 'que',
  'esta', 'este', 'estas', 'estos', 'ser', 'estar', 'tener', 'haber', 'experiencia',
  'conocimiento', 'deseable', 'requisito', 'requisitos', 'trabajo', 'cargo', 'empresa',
]);

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL');
}

function getKeywords(value: string): string[] {
  const keywords = new Map<string, string>();
  const tokens = value.match(/[\p{L}\p{N}][\p{L}\p{N}+.#/-]{2,}/gu) ?? [];
  for (const token of tokens) {
    const normalized = normalizeText(token);
    if (!stopwords.has(normalized) && !/^\d+$/.test(normalized) && !keywords.has(normalized)) {
      keywords.set(normalized, token);
    }
  }
  return [...keywords.values()].slice(0, 20);
}

function startYear(value: string): number {
  return Number(value.match(/(?:19|20)\d{2}/)?.[0] ?? 0);
}

export default function AdaptadorCVClient() {
  const { cv, isLoading, updateCV, resetCV } = useCVAnalyzer();
  const { accessToken } = useAuth();
  const [cargo, setCargo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [descripcionOferta, setDescripcionOferta] = useState('');
  const [contextInitialized, setContextInitialized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isLoading || !cv || contextInitialized) return;
    const params = new URLSearchParams(window.location.search);
    setCargo(params.get('cargo') ?? cv.cargoObjetivo ?? '');
    setEmpresa(params.get('empresa') ?? '');
    setDescripcionOferta(params.get('descripcion') ?? '');
    setContextInitialized(true);
  }, [contextInitialized, cv, isLoading]);

  const keywords = useMemo(() => {
    if (!cv) return { encontradas: [], faltantes: [], recomendadas: [] };
    const offerTerms = getKeywords(`${cargo} ${descripcionOferta}`);
    const cvText = normalizeText([
      cv.nombre,
      cv.resumen ?? '',
      ...cv.experiencias.flatMap((experience) => [
        experience.cargo,
        experience.empresa,
        experience.descripcion,
        ...experience.habilidades,
      ]),
      ...cv.educación.flatMap((education) => [education.grado, education.institución, education.especialización ?? '']),
      ...cv.habilidades.map((skill) => skill.nombre),
    ].join(' '));
    const cvTerms = new Set(getKeywords(cvText).map(normalizeText));
    const encontradas = offerTerms.filter((term) => cvTerms.has(normalizeText(term)));
    const faltantes = offerTerms.filter((term) => !cvTerms.has(normalizeText(term)));
    return { encontradas, faltantes, recomendadas: [] };
  }, [cargo, cv, descripcionOferta]);

  const keywordCount = keywords.encontradas.length + keywords.faltantes.length;
  const keywordScore = keywordCount ? Math.round((keywords.encontradas.length / keywordCount) * 100) : 0;

  const handleGenerateCV = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!cv) {
      setErrorMessage('No se pudo cargar el CV. Revisa tu Perfil Maestro e inténtalo nuevamente.');
      return;
    }
    if (!cargo.trim()) {
      setErrorMessage('Ingresa el cargo al que quieres postular.');
      return;
    }
    if (!accessToken) {
      setErrorMessage('Tu sesión expiró. Vuelve a iniciar sesión para usar la IA.');
      return;
    }

    setIsGenerating(true);
    try {
      const orderedExperienceEntries = cv.experiencias
        .map((experience, index) => ({ experience, index }))
        .sort((left, right) => startYear(right.experience.fechaInicio) - startYear(left.experience.fechaInicio))
        .slice(0, 15);
      const response = await fetch(`${API_URL}/auth/ia/adaptar-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          cargo_postulacion: cargo.trim().slice(0, 200),
          empresa: empresa.trim().slice(0, 200),
          descripcion_oferta: descripcionOferta.trim().slice(0, 6000),
          cv_actual: {
            summary: (cv.resumen ?? '').slice(0, 1600),
            experiences: orderedExperienceEntries.map(({ experience }) => ({
              role: experience.cargo.slice(0, 160),
              company: experience.empresa.slice(0, 160),
              start_date: experience.fechaInicio.slice(0, 60),
              end_date: (experience.fechaFin ?? '').slice(0, 60),
              description: experience.descripcion.slice(0, 1600),
              skills: experience.habilidades.slice(0, 30),
            })),
            education: cv.educación.map((education) => ({
              degree: education.grado.slice(0, 200),
              institution: education.institución.slice(0, 200),
              year: education.año || null,
            })).slice(0, 12),
            skills: cv.habilidades.map((skill) => skill.nombre.slice(0, 120)).slice(0, 60),
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : 'No se pudo adaptar el CV.';
        throw new Error(detail);
      }
      const adapted = data as AdaptedCVResponse;
      const updates = new Map<number, AdaptedExperience>();
      adapted.experiencias.forEach((experience) => {
        const target = orderedExperienceEntries[experience.indice];
        if (target) updates.set(target.index, experience);
      });
      const adaptedExperiences = cv.experiencias.map((experience, index) => {
        const update = updates.get(index);
        if (!update) return experience;
        return {
          ...experience,
          descripcion: update.logros.length
            ? update.logros.map((achievement) => `• ${achievement}`).join('\n')
            : experience.descripcion,
          habilidades: update.habilidades.length ? update.habilidades : experience.habilidades,
        };
      });
      const availableSkills = new Map(cv.habilidades.map((skill) => [normalizeText(skill.nombre), skill]));
      const preferredSkills = adapted.habilidades
        .map((skill) => availableSkills.get(normalizeText(skill)))
        .filter((skill): skill is (typeof cv.habilidades)[number] => Boolean(skill));
      const preferredSkillNames = new Set(preferredSkills.map((skill) => normalizeText(skill.nombre)));

      updateCV({
        ...cv,
        cargoObjetivo: cargo.trim(),
        habilidadesPersonalizadas: true,
        resumen: adapted.resumen || cv.resumen,
        experiencias: adaptedExperiences,
        habilidades: [
          ...preferredSkills,
          ...cv.habilidades.filter((skill) => !preferredSkillNames.has(normalizeText(skill.nombre))),
        ],
      });
      setSuccessMessage('CV adaptado y guardado en este navegador. Revisa el contenido antes de descargarlo.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo adaptar el CV.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center gap-2 text-on-surface-variant"><LoaderCircle className="animate-spin" size={18} /> Cargando Perfil Maestro...</div>;
  }

  if (!cv) {
    return (
      <div className="mx-auto max-w-2xl rounded-container border border-border bg-surface-container-lowest p-8 text-center">
        <h1 className="text-headline-md font-semibold text-on-surface">No encontramos tu CV</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">Completa tu Perfil Maestro para crear un CV editable y adaptarlo al cargo que buscas.</p>
        <a className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/perfil-maestro">Ir al Perfil Maestro</a>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-headline-lg text-on-surface">
            <Sparkles className="text-primary" size={28} /> Adaptador de CV
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Crea un CV estilo Harvard, editable y legible por sistemas ATS.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={resetCV} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low">
            <RotateCcw size={16} /> Restaurar Perfil Maestro
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Download size={16} /> Descargar / imprimir PDF
          </button>
        </div>
      </header>

      <section className="rounded-container border border-border bg-surface-container-lowest p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-headline-sm font-semibold text-on-surface">Oferta objetivo</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">Si llegaste desde la extensión, el cargo y la descripción ya están cargados.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block text-label-sm font-medium text-on-surface-variant">
            Cargo al que postulas
            <input className={inputClass} value={cargo} maxLength={200} onChange={(event) => setCargo(event.target.value)} placeholder="Ej. Analista de datos" />
          </label>
          <label className="block text-label-sm font-medium text-on-surface-variant">
            Empresa (opcional)
            <input className={inputClass} value={empresa} maxLength={200} onChange={(event) => setEmpresa(event.target.value)} placeholder="Nombre de la empresa" />
          </label>
          <label className="block text-label-sm font-medium text-on-surface-variant lg:col-span-2">
            Descripción de la oferta (opcional, pero ayuda a priorizar palabras clave)
            <textarea className={inputClass} rows={4} maxLength={6000} value={descripcionOferta} onChange={(event) => setDescripcionOferta(event.target.value)} placeholder="Pega aquí las responsabilidades y requisitos del cargo." />
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={handleGenerateCV} disabled={isGenerating} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            {isGenerating ? <LoaderCircle className="animate-spin" size={17} /> : <Sparkles size={17} />}
            {isGenerating ? 'Creando CV para este cargo...' : 'Crear CV Harvard con IA'}
          </button>
          <p className="text-label-sm text-on-surface-variant">La IA reorganiza y redacta únicamente con información del perfil y del CV editable.</p>
        </div>
        {errorMessage && <p role="alert" className="mt-4 flex items-start gap-2 rounded-md border border-error/30 bg-error-container/20 p-3 text-sm text-error"><AlertCircle className="mt-0.5 shrink-0" size={16} />{errorMessage}</p>}
        {successMessage && <p role="status" className="mt-4 flex items-start gap-2 rounded-md border border-success/30 bg-success-container/20 p-3 text-sm text-success"><CheckCircle2 className="mt-0.5 shrink-0" size={16} />{successMessage}</p>}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-6">
          <div>
            <h2 className="mb-3 text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">Vista previa estilo Harvard</h2>
            <CVPreview cv={{ ...cv, cargoObjetivo: cargo.trim() || cv.cargoObjetivo }} />
          </div>
          <div className="rounded-container border border-border bg-surface-container-lowest p-4">
            <ATSScoreGauge score={keywordScore} label="Coincidencia literal de términos" />
            <p className="mt-3 flex items-start gap-2 text-label-sm text-on-surface-variant"><AlertCircle className="mt-0.5 shrink-0" size={15} />Es una referencia basada en términos visibles, no garantiza que un ATS acepte el CV. Agrega solo habilidades que realmente domines.</p>
          </div>
        </aside>

        <div className="space-y-5">
          <KeywordAnalyzer keywords={keywords} />
          <p className="-mt-3 px-1 text-label-sm text-on-surface-variant">Las palabras faltantes provienen de la oferta. Inclúyelas solo si describen tu experiencia real.</p>
          <CVEditor cv={cv} onChange={updateCV} />
        </div>
      </div>
    </div>
  );
}
