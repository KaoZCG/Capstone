import React from 'react';

export function Ecosystem() {
  const portales = [
    { initial: 'L', name: 'Laborum.cl', badge: 'Autollenado 100%', status: 'Integrado' },
    { initial: 'T', name: 'Trabajando.com', badge: 'Preguntas IA', status: 'Integrado' },
    { initial: 'In', name: 'LinkedIn Jobs', badge: 'Soporte en desarrollo', status: 'Próximamente' },
    { initial: 'Ch', name: 'ChileTrabajos', badge: 'Soporte en desarrollo', status: 'Próximamente' },
    { initial: 'Co', name: 'Computrabajo', badge: 'Soporte en desarrollo', status: 'Próximamente' },
  ];

  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="text-primary text-xs font-bold uppercase tracking-widest mb-2 block">Ecosistema Laboral</span>
          <h2 className="text-3xl font-bold text-on-surface mb-4">Diseñado exclusivamente para Chile</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">Actualmente integramos la extensión con Laborum y Trabajando.com; pronto sumaremos más portales.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {portales.map((p, i) => (
            <div key={i} className="bg-surface-container-lowest border border-border rounded-xl p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 mx-auto bg-surface-container text-on-surface-variant font-black text-xl rounded-lg flex items-center justify-center mb-4">
                {p.initial}
              </div>
              <h3 className="font-bold text-on-surface text-sm mb-1">{p.name}</h3>
              <p className="text-[10px] text-on-surface-variant mb-4">{p.badge}</p>
              <span className={`inline-block border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                p.status === 'Integrado'
                  ? 'bg-success-container/20 border-success/30 text-success'
                  : 'bg-surface-container border-border text-on-surface-variant'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}