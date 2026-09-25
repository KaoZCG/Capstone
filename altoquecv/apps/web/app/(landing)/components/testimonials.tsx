import React from 'react';
import { testimonialesMock } from '@/lib/mock/landing.mock';
import { Star } from 'lucide-react';

export function Testimonials() {
  return (
    <section id="testimonios" className="py-24 bg-surface-container-lowest border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <span className="text-primary text-xs font-bold uppercase tracking-widest mb-2 block">Casos de Éxito Reales</span>
            <h2 className="text-3xl font-bold text-on-surface">Profesionales que ya avanzaron</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-success">4.9/5</span>
            <div className="flex text-warning">
              {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
            </div>
            <span className="text-xs text-on-surface-variant ml-2">(+1,200 valoraciones)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonialesMock.map(t => (
            <div key={t.id} className="bg-surface border border-border rounded-2xl p-6 flex flex-col shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <img src={t.avatar} alt={t.nombre} className="w-12 h-12 rounded-full object-cover bg-surface-container-highest" />
                <div>
                  <h4 className="font-bold text-sm text-on-surface">{t.nombre}</h4>
                  <p className="text-xs text-on-surface-variant">{t.rol}</p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant italic mb-6 flex-1 leading-relaxed">"{t.quote}"</p>
              <div className="bg-surface-container-low px-3 py-2 rounded text-xs font-medium text-on-surface flex justify-between items-center border border-border">
                <span className="text-on-surface-variant">Contratado en:</span>
                <strong>{t.empresa}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}