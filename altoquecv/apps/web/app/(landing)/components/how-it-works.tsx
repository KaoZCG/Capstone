import React from 'react';

export function HowItWorks() {
  const steps = [
    { num: "01", title: "Crea tu Perfil Maestro", desc: "Sube tu CV actual o conéctate en 2 minutos. Centralizamos tu historial, experiencia y pretensiones salariales en una sola fuente de verdad.", badge: "Configurable una única vez" },
    { num: "02", title: "Instala la extensión", desc: "Añade la extensión oficial para Chrome o Brave. AltoqueCV se activa automáticamente y de forma silenciosa cada vez que visitas una vacante.", badge: "1-click install" },
    { num: "03", title: "Postula a 1-clic con IA", desc: "Nuestra IA genera al vuelo una versión de tu CV sintonizada con las palabras clave exactas de la oferta y completa preguntas abiertas.", badge: "Ahorra hasta 35 min por oferta" },
  ];

  return (
    <section id="como-funciona" className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-20">
          <span className="text-primary text-xs font-bold uppercase tracking-widest mb-2 block">Flujo Ultrarrápido</span>
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">Cómo funciona en 3 simples pasos</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">Elimina la fricción de llenar los mismos formularios una y otra vez. Tu tiempo debe invertirse en prepararte para las entrevistas.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="bg-surface-container-lowest border border-border rounded-2xl p-8 shadow-sm relative">
              <div className="w-12 h-12 bg-primary-container/20 text-primary font-black text-xl rounded-lg flex items-center justify-center mb-6">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{step.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">{step.desc}</p>
              
              <div className="absolute bottom-6 left-8 right-8">
                <div className="bg-surface-container px-3 py-2 rounded-md text-xs font-medium text-on-surface-variant flex items-center justify-center">
                  {step.badge}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}