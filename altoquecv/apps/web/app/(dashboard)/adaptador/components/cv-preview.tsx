import React from 'react';
import { CV } from '@/types';

export function CVPreview({ cv }: { cv: CV }) {
  return (
    <div className="w-full aspect-[1/1.414] bg-white rounded-md shadow-sm border border-slate-200 p-8 overflow-y-auto print-friendly text-slate-900 mx-auto max-w-[800px]">
      {/* Header */}
      <header className="border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold font-serif text-slate-900 mb-1">{cv.nombre}</h1>
        <div className="text-sm text-slate-600 flex gap-3">
          <span>{cv.email}</span>
          <span>•</span>
          <span>{cv.teléfono}</span>
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
          {cv.experiencias.map((exp, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-md font-bold text-slate-900">{exp.cargo}</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(exp.fechaInicio).getFullYear()} - {exp.fechaFin ? new Date(exp.fechaFin).getFullYear() : 'Presente'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-2">{exp.empresa}</p>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">{exp.descripcion}</p>
              <div className="text-xs text-slate-500">
                <span className="font-semibold">Tech stack:</span> {exp.habilidades.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Educación */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1">Educación</h2>
        {cv.educación.map((edu, idx) => (
          <div key={idx} className="flex justify-between items-baseline">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{edu.grado}</h3>
              <p className="text-sm text-slate-700">{edu.institución}</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">{edu.año}</span>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-300 pb-1">Habilidades Principales</h2>
        <div className="flex flex-wrap gap-2">
          {cv.habilidades.map((skill, idx) => (
            <span key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-800 rounded">
              {skill.nombre}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}