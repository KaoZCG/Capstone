"use client";

import { PhoneInput } from '@/components/ui/PhoneInput';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';

const tabs = [
  "Datos Personales",
  "Educación",
  "Experiencia Laboral",
  "Habilidades & Keywords",
  "Pretensiones Salariales"
];

export default function PerfilMaestroPage() {
  const { usuario } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  
  // Estado para Datos Personales
  const [personalData, setPersonalData] = useState({
    nombre: usuario?.nombre || '',
    rut: usuario?.rut || '',
    email: usuario?.email || '',
    teléfono: usuario?.teléfono || '',
    codigoTeléfono: '+56',
    región: '',
    comuna: '',
  });

  const [salaryData, setSalaryData] = useState({
    min: '',
    max: '',
  });

  useEffect(() => {
    if (!profile) return;
    setPersonalData((previous) => ({
      ...previous,
      nombre: `${profile.first_name} ${profile.last_name}`.trim(),
      rut: profile.rut,
      email: profile.email,
      teléfono: profile.phone ?? '',
    }));
    setSalaryData({
      min: profile.salary_min?.toString() ?? '',
      max: profile.salary_max?.toString() ?? '',
    });
  }, [profile]);

  const handlePersonalDataChange = (field: string, value: string) => {
    setPersonalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSalaryChange = (field: string, value: string) => {
    setSalaryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        
        {/* Sección: Datos Personales */}
        {activeTab === tabs[0] && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-headline-md text-on-surface">Datos Personales</h2>
              <Badge variant="success">Completado</Badge>
            </div>

            <Card className="p-8">
              <div className="flex flex-col sm:flex-row gap-8 mb-8">
                {/* Avatar */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden mb-4">
                    <img 
                      src="/professional_studio_headshot_of_a_chilean_professional_man_in_his_late_20s.png" 
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button variant="secondary" className="text-label-sm">Cambiar foto</Button>
                </div>

                {/* Nombre y RUT */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-md font-semibold mb-2 text-on-surface">Nombre Completo</label>
                    <Input
                      value={personalData.nombre}
                      onChange={(e) => handlePersonalDataChange('nombre', e.target.value)}
                      placeholder="Ingresa tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold mb-2 text-on-surface">RUT / Cédula</label>
                    <div className="flex gap-2">
                      <Input
                        value={personalData.rut}
                        onChange={(e) => handlePersonalDataChange('rut', e.target.value)}
                        placeholder="18.456.789-K"
                        className="flex-1"
                      />
                      <Badge variant="success" className="flex items-center px-3">✓ Verificado</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">Correo Electrónico</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={personalData.email}
                      onChange={(e) => handlePersonalDataChange('email', e.target.value)}
                      placeholder="correo@example.com"
                      className="flex-1"
                    />
                    <Badge variant="success" className="flex items-center px-3">✓ Verificado</Badge>
                  </div>
                </div>
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">Teléfono Móvil</label>
                  <PhoneInput
                    value={personalData.teléfono}
                    onChange={(tel) => handlePersonalDataChange('teléfono', tel)}
                    countryCode={personalData.codigoTeléfono}
                    onCountryCodeChange={(code) => handlePersonalDataChange('codigoTeléfono', code)}
                    placeholder="9 1234 5678"
                  />
                </div>
              </div>

              {/* Región y Comuna */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">Región</label>
                  <Input
                    value={personalData.región}
                    onChange={(e) => handlePersonalDataChange('región', e.target.value)}
                    placeholder="Región Metropolitana"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">Comuna</label>
                  <Input
                    value={personalData.comuna}
                    onChange={(e) => handlePersonalDataChange('comuna', e.target.value)}
                    placeholder="Santiago"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Sección: Educación */}
        {activeTab === tabs[1] && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md text-on-surface">Educación</h3>
              <Button variant="ghost" className="text-primary">+ Añadir Educación</Button>
            </div>
            <div className="flex flex-col gap-4">
              {(profile?.education ?? []).map((edu) => (
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
        )}

        {/* Sección: Experiencia Laboral */}
        {activeTab === tabs[2] && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md text-on-surface">Experiencia Laboral</h3>
              <Button variant="ghost" className="text-primary">+ Añadir Experiencia</Button>
            </div>
            <div className="relative border-l-2 border-surface-container-highest ml-4 pl-8 flex flex-col gap-8">
              {(profile?.experience ?? []).map((exp) => (
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
        )}

        {/* Sección: Habilidades & Keywords */}
        {activeTab === tabs[3] && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md text-on-surface">Habilidades & Keywords</h3>
              <Button variant="ghost" className="text-primary">+ Agregar Skill</Button>
            </div>
            <Card>
              <div className="flex flex-wrap gap-3">
                {(profile?.skills ?? []).map((skill) => (
                  <Pill key={skill} className="bg-primary-container text-on-primary-container">
                    {skill}
                  </Pill>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Sección: Pretensiones Salariales */}
        {activeTab === tabs[4] && (
          <div>
            <h3 className="text-headline-md text-on-surface mb-4">Pretensiones Salariales</h3>
            <Card className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">
                    Rango Salarial Mínimo (CLP)
                  </label>
                  <Input
                    type="number"
                    placeholder="2.500.000"
                    value={salaryData.min}
                    onChange={(e) => handleSalaryChange('min', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">
                    Rango Salarial Máximo (CLP)
                  </label>
                  <Input
                    type="number"
                    placeholder="5.000.000"
                    value={salaryData.max}
                    onChange={(e) => handleSalaryChange('max', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Acciones Finales */}
        <div className="flex items-center justify-end gap-4 mt-4 pt-6 border-t border-border">
          <Button variant="secondary">Descargar sombra</Button>
          <Button variant="primary">Guardar Cambios</Button>
        </div>
      </div>
    </div>
  );
}
