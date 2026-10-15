'use client';

import { CV, CVEducacion, CVExperiencia } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

const inputClass = 'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const labelClass = 'block text-label-sm font-medium text-on-surface-variant';

interface Props {
  cv: CV;
  onChange: (cv: CV) => void;
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function CVEditor({ cv, onChange }: Props) {
  const updateExperience = (index: number, values: Partial<CVExperiencia>) => {
    onChange({
      ...cv,
      experiencias: cv.experiencias.map((experience, itemIndex) =>
        itemIndex === index
          ? { ...experience, ...values, ...(values.habilidades ? { habilidades: values.habilidades.slice(0, 30) } : {}) }
          : experience
      ),
    });
  };

  const updateEducation = (index: number, values: Partial<CVEducacion>) => {
    onChange({
      ...cv,
      educación: cv.educación.map((education, itemIndex) =>
        itemIndex === index ? { ...education, ...values } : education
      ),
    });
  };

  const updateSkills = (value: string) => {
    const previous = new Map(cv.habilidades.map((skill) => [skill.nombre.trim().toLowerCase(), skill]));
    const names = Array.from(new Set(value.split(/[\n,]/).map((name) => name.trim()).filter(Boolean))).slice(0, 60);
    onChange({
      ...cv,
      habilidadesPersonalizadas: true,
      habilidades: names.map((nombre) => previous.get(nombre.toLowerCase()) ?? {
        nombre,
        nivel: 'mid' as const,
        categoría: 'técnica' as const,
      }),
    });
  };

  return (
    <section className="rounded-container border border-border bg-surface-container-lowest p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-headline-sm font-semibold text-on-surface">Editar CV</h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Los cambios se guardan automáticamente en este navegador.
        </p>
      </div>

      <div className="space-y-7">
        <section className="space-y-3">
          <h3 className="text-label-lg font-semibold text-on-surface">Datos de contacto</h3>
          <TextField label="Nombre completo" value={cv.nombre} onChange={(nombre) => onChange({ ...cv, nombre })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Correo" type="email" value={cv.email} onChange={(email) => onChange({ ...cv, email })} />
            <TextField label="Teléfono" type="tel" value={cv.teléfono} onChange={(teléfono) => onChange({ ...cv, teléfono })} />
          </div>
          <label className={labelClass}>
            Resumen profesional
            <textarea
              className={inputClass}
              rows={4}
              maxLength={1200}
              value={cv.resumen ?? ''}
              onChange={(event) => onChange({ ...cv, resumen: event.target.value })}
            />
          </label>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-label-lg font-semibold text-on-surface">Experiencia</h3>
            <button
              type="button"
              disabled={cv.experiencias.length >= 15}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-label-sm text-primary hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (cv.experiencias.length >= 15) return;
                onChange({
                  ...cv,
                  experiencias: [...cv.experiencias, {
                    empresa: '', cargo: '', fechaInicio: '', descripcion: '', habilidades: [],
                  }],
                });
              }}
            >
              <Plus size={14} /> Agregar
            </button>
          </div>

          {cv.experiencias.map((experience, index) => (
            <article key={`${index}-${experience.empresa}`} className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-label-sm font-semibold text-on-surface">Experiencia {index + 1}</p>
                <button
                  type="button"
                  aria-label={`Eliminar experiencia ${index + 1}`}
                  className="rounded p-1 text-error hover:bg-error-container/30"
                  onClick={() => onChange({
                    ...cv,
                    experiencias: cv.experiencias.filter((_, itemIndex) => itemIndex !== index),
                  })}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Cargo" value={experience.cargo} onChange={(cargo) => updateExperience(index, { cargo })} />
                <TextField label="Empresa" value={experience.empresa} onChange={(empresa) => updateExperience(index, { empresa })} />
                <TextField label="Desde" value={experience.fechaInicio} onChange={(fechaInicio) => updateExperience(index, { fechaInicio })} />
                <TextField label="Hasta" value={experience.fechaFin ?? ''} onChange={(fechaFin) => updateExperience(index, { fechaFin: fechaFin || undefined })} />
              </div>
              <label className={labelClass}>
                Logros y responsabilidades
                <textarea
                  className={inputClass}
                  rows={5}
                  value={experience.descripcion}
                  onChange={(event) => updateExperience(index, { descripcion: event.target.value })}
                  placeholder="Un logro por línea; agrega métricas solo si son reales."
                />
              </label>
              <TextField
                label="Herramientas o habilidades de esta experiencia (separadas por coma)"
                value={experience.habilidades.join(', ')}
                onChange={(value) => updateExperience(index, {
                  habilidades: value.split(',').map((skill) => skill.trim()).filter(Boolean).slice(0, 30),
                })}
              />
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-label-lg font-semibold text-on-surface">Formación</h3>
            <button
              type="button"
              disabled={cv.educación.length >= 12}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-label-sm text-primary hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (cv.educación.length >= 12) return;
                onChange({
                  ...cv,
                  educación: [...cv.educación, { institución: '', grado: '', año: 0 }],
                });
              }}
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
          {cv.educación.map((education, index) => (
            <article key={`${index}-${education.institución}`} className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-label-sm font-semibold text-on-surface">Estudio {index + 1}</p>
                <button
                  type="button"
                  aria-label={`Eliminar estudio ${index + 1}`}
                  className="rounded p-1 text-error hover:bg-error-container/30"
                  onClick={() => onChange({ ...cv, educación: cv.educación.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Título o grado" value={education.grado} onChange={(grado) => updateEducation(index, { grado })} />
                <TextField label="Institución" value={education.institución} onChange={(institución) => updateEducation(index, { institución })} />
                <label className={labelClass}>
                  Año
                  <input
                    className={inputClass}
                    type="number"
                    min="1900"
                    max="2100"
                    value={education.año || ''}
                    onChange={(event) => updateEducation(index, { año: Number(event.target.value) || 0 })}
                  />
                </label>
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <h3 className="text-label-lg font-semibold text-on-surface">Habilidades</h3>
          <label className={labelClass}>
            Una por línea o separadas por coma
            <textarea
              className={inputClass}
              rows={4}
              value={cv.habilidades.map((skill) => skill.nombre).join('\n')}
              onChange={(event) => updateSkills(event.target.value)}
            />
          </label>
        </section>
      </div>
    </section>
  );
}
