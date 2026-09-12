"use client";
import { useState } from "react";
import { mockProfile } from "@/lib/mock/perfil-maestro.mock";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Badge } from "@/components/ui/Badge";
import { PersonalDataCard } from "@/components/perfil-maestro/PersonalDataCard";

const tabs = [
  "Datos Personales",
  "Educación",
  "Experiencia Laboral",
  "Habilidades & Keywords",
  "Pretensiones Salariales"
];

export default function PerfilMaestroPage() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [selectedModel, setSelectedModel] = useState(mockProfile.iaPreferences[0].id);

  return (
    <div className="flex gap-8">
      {/* Navegación Secundaria */}
      <aside className="w-64 shrink-0">
        <h1 className="text-headline-lg-mobile text-on-surface mb-6">Mi Perfil Maestro</h1>
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-2.5 rounded-button text-label-md transition-colors ${
                activeTab === tab
                  ? "bg-surface-container text-on-surface font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-lowest"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col gap-8 pb-20">
        
        {/* Sección: Datos Personales (Siempre visible si es la tab activa, pero mostrada aquí como flujo principal para el renderizado solicitado) */}
        <PersonalDataCard data={mockProfile.personalData} />

        {/* Sección: Educación */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-md text-on-surface">Educación</h3>
            <Button variant="ghost" className="text-primary">+ Añadir Educación</Button>
          </div>
          <div className="flex flex-col gap-4">
            {mockProfile.education.map((edu) => (
              <Card key={edu.id} className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h4 className="text-body-lg font-semibold text-on-surface">{edu.degree}</h4>
                  <p className="text-body-md text-on-surface-variant">{edu.institution}</p>
                  <div className="flex gap-2 mt-3">
                    {edu.tags.map((tag) => (
                      <Pill key={tag}>{tag}</Pill>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-label-sm text-on-surface-variant">{edu.startDate} — {edu.endDate}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sección: Experiencia Laboral */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-md text-on-surface">Experiencia Laboral</h3>
            <Button variant="ghost" className="text-primary">+ Añadir Experiencia</Button>
          </div>
          <div className="relative border-l-2 border-surface-container-highest ml-4 pl-8 flex flex-col gap-8">
            {mockProfile.experience.map((exp) => (
              <div key={exp.id} className="relative">
                <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-2 border-background bg-primary"></span>
                <Card>
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-body-lg font-semibold text-on-surface">{exp.role}</h4>
                        {exp.isCurrent && <Badge variant="success">Actual</Badge>}
                      </div>
                      <p className="text-body-md text-on-surface-variant">{exp.company}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-label-sm text-on-surface-variant">{exp.startDate} — {exp.endDate}</p>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface mb-4">{exp.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {exp.stackTags.map((tag) => (
                      <Pill key={tag}>{tag}</Pill>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Sección: Preferencias de IA */}
        <div>
          <h3 className="text-headline-md text-on-surface mb-4">Preferencias de IA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockProfile.iaPreferences.map((pref) => (
              <Card 
                key={pref.id}
                onClick={() => setSelectedModel(pref.id)}
                className={`cursor-pointer transition-colors ${selectedModel === pref.id ? 'border-primary ring-1 ring-primary bg-primary-container/5 dark:bg-primary/5' : ''}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedModel === pref.id ? 'border-primary' : 'border-outline'}`}>
                    {selectedModel === pref.id && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                  <h4 className="text-label-md text-on-surface">{pref.model}</h4>
                </div>
                <p className="text-body-md text-on-surface-variant ml-7">{pref.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Acciones Finales */}
        <div className="flex items-center justify-end gap-4 mt-4 pt-6 border-t border-border">
          <Button variant="secondary">Descargar sombra</Button>
          <Button variant="primary">Guardar Cambios</Button>
        </div>
      </div>
    </div>
  );
}