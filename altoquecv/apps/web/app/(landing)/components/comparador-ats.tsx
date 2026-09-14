import React from 'react';
import { comparadorATSMock } from '@/lib/mock/landing.mock';
import { CheckCircle2 } from 'lucide-react';

export function ComparadorATS() {
  return (
    <section className="py-24 bg-surface-container-lowest border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-16 items-center">
        
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface-variant mb-6 uppercase tracking-wider">
            Motor Algorítmico
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-6 leading-tight">
            Supera los filtros ATS sin alterar la veracidad de tu historia
          </h2>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            Más del 70% de los CVs en empresas líderes son descartados por robots antes de que un reclutador los lea. AltoqueCV mapea tu experiencia para maximizar coincidencias semánticas.
          </p>
          <ul className="space-y-4">
            {['Mapeo de habilidades blandas y duras (sinónimos).', 'Formato limpio y legible para parsers corporativos.', 'Sin inventar experiencia: optimización ética.'].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-on-surface font-medium">
                <CheckCircle2 className="text-success shrink-0 mt-0.5" size={20} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-container border border-border rounded-2xl p-2 shadow-inner overflow-hidden">
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-surface-container-low/50">
              <h3 className="font-bold text-on-surface">Comparativa de Impacto ATS</h3>
              <p className="text-xs text-on-surface-variant">Basado en datos de 5,000+ postulaciones chilenas.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container text-on-surface-variant text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Métrica Clave</th>
                    <th className="px-6 py-4 font-semibold">Promedio</th>
                    <th className="px-6 py-4 font-semibold">Con AltoqueCV</th>
                    <th className="px-6 py-4 font-semibold text-right">Mejora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparadorATSMock.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 font-medium text-on-surface">{row.metrica}</td>
                      <td className="px-6 py-4 text-error font-medium">{row.promedio}</td>
                      <td className="px-6 py-4 text-success font-bold">{row.conAltoqueCV}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-warning-container text-on-warning-container px-2 py-1 rounded text-xs font-bold">
                          {row.mejora}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}