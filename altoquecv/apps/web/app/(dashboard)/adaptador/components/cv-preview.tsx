import React from 'react';
import { CV } from '@/types';

export function CVPreview({ cv }: { cv: CV }) {
  const experienciasOrdenadas = [...cv.experiencias].sort((left, right) => {
    const leftYear = Number(left.fechaInicio.match(/(?:19|20)\d{2}/)?.[0] ?? 0);
    const rightYear = Number(right.fechaInicio.match(/(?:19|20)\d{2}/)?.[0] ?? 0);
    return rightYear - leftYear;
  });
  const estudiosOrdenados = [...cv.educación].sort((left, right) => right.año - left.año);
  const datosContacto = [cv.email, cv.teléfono].filter((value) => value.trim());

  return (
    <article className="cv-print-target mx-auto w-full max-w-[800px] rounded-md border border-slate-200 bg-white p-8 text-slate-900 shadow-sm">
      {/* Header */}
      <header className="border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="mb-1 text-3xl font-bold text-slate-900">{cv.nombre}</h1>
        {cv.cargoObjetivo && <p className="mb-2 text-sm font-semibold text-slate-700">{cv.cargoObjetivo}</p>}
        <div className="flex flex-wrap gap-x-3 text-sm text-slate-600">
          {datosContacto.map((dato, index) => (
            <React.Fragment key={`${dato}-${index}`}>
              {index > 0 && <span aria-hidden="true">•</span>}
              <span>{dato}</span>
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* Resumen */}
      {cv.resumen && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">Resumen Profesional</h2>
          <p className="text-sm leading-relaxed text-slate-700">{cv.resumen}</p>
        </section>
      )}

      {/* Experiencia */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1">Experiencia Laboral</h2>
        <div className="space-y-4">
          {experienciasOrdenadas.map((exp, idx) => (
            <div key={`${exp.empresa}-${exp.cargo}-${idx}`} className="break-inside-avoid">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-md font-bold text-slate-900">{exp.cargo}</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {exp.fechaInicio.match(/(?:19|20)\d{2}/)?.[0] ?? ''}
                  {exp.fechaFin ? ` - ${exp.fechaFin.match(/(?:19|20)\d{2}/)?.[0] ?? exp.fechaFin}` : exp.fechaInicio ? ' - Presente' : ''}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-2">{exp.empresa}</p>
              {exp.descripcion && <p className="mb-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{exp.descripcion}</p>}
              {exp.habilidades.length > 0 && <p className="text-xs text-slate-600"><span className="font-semibold">Herramientas:</span> {exp.habilidades.join(', ')}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Educación */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1">Educación</h2>
        {estudiosOrdenados.map((edu, idx) => (
          <div key={`${edu.institución}-${edu.grado}-${idx}`} className="mb-2 flex justify-between items-baseline break-inside-avoid">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{edu.grado}</h3>
              <p className="text-sm text-slate-700">{edu.institución}</p>
            </div>
            {edu.año > 0 && <span className="text-xs text-slate-500 font-mono">{edu.año}</span>}
          </div>
        ))}
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1">Habilidades Principales</h2>
        <p className="text-sm leading-relaxed text-slate-700">{cv.habilidades.map((skill) => skill.nombre).join(' · ')}</p>
      </section>
    </article>
  );
}
