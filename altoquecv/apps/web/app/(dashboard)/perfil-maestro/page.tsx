"use client";

import { PhoneInput } from '@/components/ui/PhoneInput';
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { Education, Experience } from '@/types/perfil';
import { PROFILE_KEYWORD_CATEGORIES, TECHNICAL_SKILL_CATEGORIES } from '@/lib/profile-catalogs';
import { Search, Trash2, X } from 'lucide-react';

type ProfileModal = 'education' | 'experience' | 'skills' | 'keywords' | null;

const initialSalaryData = {
  min: '',
  max: '',
  currency: 'CLP',
  period: 'Mensual',
  negotiable: false,
};

const emptyEducationForm = {
  institution: '',
  degree: '',
  startDate: '',
  endDate: '',
  studying: false,
  location: '',
  studyMode: 'Presencial',
  description: '',
  tags: '',
};

const emptyExperienceForm = {
  role: '',
  company: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  location: '',
  employmentType: 'Jornada completa',
  description: '',
  stackTags: '',
};

const tabs = [
  "Datos Personales",
  "Educación",
  "Experiencia Laboral",
  "Habilidades & Keywords",
  "Pretensiones Salariales"
];

export default function PerfilMaestroPage() {
  const { usuario } = useAuth();
  const { profile, isLoading } = useProfile();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [modal, setModal] = useState<ProfileModal>(null);
  const [educationForm, setEducationForm] = useState(emptyEducationForm);
  const [experienceForm, setExperienceForm] = useState(emptyExperienceForm);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customCatalogValue, setCustomCatalogValue] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const [hydratedKey, setHydratedKey] = useState('');
  const storageKey = `altoquecv-profile:${profile?.user_id ?? usuario?.email ?? 'local'}`;
  
  const [personalData, setPersonalData] = useState({
    nombre: usuario?.nombre || '',
    rut: usuario?.rut || '',
    email: usuario?.email || '',
    teléfono: usuario?.teléfono || '',
    codigoTeléfono: '+56',
    región: '',
    comuna: '',
    cargoObjetivo: '',
    linkedin: '',
    portafolio: '',
    resumen: '',
  });

  const [salaryData, setSalaryData] = useState(initialSalaryData);

  useEffect(() => {
    if (isLoading) return;

    const defaults = {
      ...personalData,
      nombre: profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : usuario?.nombre ?? '',
      rut: profile?.rut ?? usuario?.rut ?? '',
      email: profile?.email ?? usuario?.email ?? '',
      teléfono: profile?.phone ?? usuario?.teléfono ?? '',
    };

    try {
      const savedProfile = localStorage.getItem(storageKey);
      if (savedProfile) {
        const saved = JSON.parse(savedProfile);
        setPersonalData({ ...defaults, ...saved.personalData });
        setEducation(saved.education ?? profile?.education ?? []);
        setExperience(saved.experience ?? profile?.experience ?? []);
        setSkills(saved.skills ?? profile?.skills ?? []);
        setKeywords(saved.keywords ?? []);
        setSalaryData({
          ...initialSalaryData,
          ...saved.salaryData,
          min: saved.salaryData?.min ?? profile?.salary_min?.toString() ?? '',
          max: saved.salaryData?.max ?? profile?.salary_max?.toString() ?? '',
        });
      } else {
        setPersonalData(defaults);
        setEducation(profile?.education ?? []);
        setExperience(profile?.experience ?? []);
        setSkills(profile?.skills ?? []);
        setSalaryData({
          ...initialSalaryData,
          min: profile?.salary_min?.toString() ?? '',
          max: profile?.salary_max?.toString() ?? '',
        });
      }
      setHydratedKey(storageKey);
    } catch {
      setPersonalData(defaults);
      setEducation(profile?.education ?? []);
      setExperience(profile?.experience ?? []);
      setSkills(profile?.skills ?? []);
      setHydratedKey(storageKey);
    }
  }, [isLoading, profile, storageKey, usuario]);

  useEffect(() => {
    if (hydratedKey !== storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify({
      personalData,
      education,
      experience,
      skills,
      keywords,
      salaryData,
    }));
  }, [education, experience, hydratedKey, keywords, personalData, salaryData, skills, storageKey]);

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

  const handleEducationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEducation((current) => [{
      id: crypto.randomUUID(),
      institution: educationForm.institution.trim(),
      degree: educationForm.degree.trim(),
      startDate: educationForm.startDate,
      endDate: educationForm.studying ? 'Presente' : educationForm.endDate,
      tags: educationForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      location: educationForm.location.trim(),
      studyMode: educationForm.studyMode,
      description: educationForm.description.trim(),
    }, ...current]);
    setEducationForm(emptyEducationForm);
    setModal(null);
  };

  const handleExperienceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExperience((current) => [{
      id: crypto.randomUUID(),
      role: experienceForm.role.trim(),
      company: experienceForm.company.trim(),
      startDate: experienceForm.startDate,
      endDate: experienceForm.isCurrent ? 'Presente' : experienceForm.endDate,
      isCurrent: experienceForm.isCurrent,
      description: experienceForm.description.trim(),
      stackTags: experienceForm.stackTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      location: experienceForm.location.trim(),
      employmentType: experienceForm.employmentType,
    }, ...current]);
    setExperienceForm(emptyExperienceForm);
    setModal(null);
  };

  const toggleCatalogValue = (value: string) => {
    const update = (current: string[]) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    if (modal === 'skills') setSkills(update);
    if (modal === 'keywords') setKeywords(update);
  };

  const addCustomCatalogValue = () => {
    const value = customCatalogValue.trim();
    if (!value) return;
    if (modal === 'skills') setSkills((current) => current.includes(value) ? current : [...current, value]);
    if (modal === 'keywords') setKeywords((current) => current.includes(value) ? current : [...current, value]);
    setCustomCatalogValue('');
  };

  const saveProfile = () => {
    localStorage.setItem(storageKey, JSON.stringify({
      personalData,
      education,
      experience,
      skills,
      keywords,
      salaryData,
    }));
    setSavedAt(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
  };

  const catalog = modal === 'skills' ? TECHNICAL_SKILL_CATEGORIES : PROFILE_KEYWORD_CATEGORIES;
  const selectedCatalogValues = modal === 'skills' ? skills : keywords;
  const filteredCatalog = Object.entries(catalog).map(([category, values]) => ({
    category,
    values: values.filter((value) => value.toLowerCase().includes(catalogSearch.trim().toLowerCase())),
  })).filter((entry) => entry.values.length > 0);
  const salaryRangeInvalid = Boolean(salaryData.min && salaryData.max && Number(salaryData.min) > Number(salaryData.max));

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Navegación Secundaria */}
      <aside className="w-full lg:w-64 lg:shrink-0">
        <h1 className="text-headline-lg-mobile text-on-surface mb-6">Mi Perfil Maestro</h1>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-2.5 rounded-button text-label-md transition-colors whitespace-nowrap shrink-0 ${
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">Cargo objetivo</label>
                  <Input value={personalData.cargoObjetivo} onChange={(e) => handlePersonalDataChange('cargoObjetivo', e.target.value)} placeholder="Ej. Desarrollador/a Full Stack" />
                </div>
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">LinkedIn</label>
                  <Input type="url" value={personalData.linkedin} onChange={(e) => handlePersonalDataChange('linkedin', e.target.value)} placeholder="https://linkedin.com/in/tu-perfil" />
                </div>
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">Portafolio o sitio web</label>
                  <Input type="url" value={personalData.portafolio} onChange={(e) => handlePersonalDataChange('portafolio', e.target.value)} placeholder="https://tuportafolio.cl" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">Resumen profesional</label>
                  <textarea value={personalData.resumen} onChange={(e) => handlePersonalDataChange('resumen', e.target.value)} rows={4} maxLength={1200} placeholder="Describe tu experiencia, especialidad y el valor que aportas." className="w-full rounded-input border border-border bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  <p className="mt-1 text-right text-label-sm text-on-surface-variant">{personalData.resumen.length}/1200</p>
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
              <Button type="button" variant="ghost" className="text-primary" onClick={() => setModal('education')}>+ Añadir Educación</Button>
            </div>
            <div className="flex flex-col gap-4">
              {education.map((edu) => (
                <Card key={edu.id} className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h4 className="text-body-lg font-semibold text-on-surface">{edu.degree}</h4>
                    <p className="text-body-md text-on-surface-variant">{edu.institution}{edu.location ? ` · ${edu.location}` : ''}</p>
                    {edu.studyMode && <p className="text-label-sm text-on-surface-variant mt-1">{edu.studyMode}</p>}
                    {edu.description && <p className="text-body-md text-on-surface-variant mt-2">{edu.description}</p>}
                    <div className="flex gap-2 mt-3">
                      {edu.tags.map((tag) => (
                        <Pill key={tag}>{tag}</Pill>
                      ))}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <p className="text-label-sm text-on-surface-variant">{edu.startDate} — {edu.endDate}</p>
                    <button type="button" onClick={() => setEducation((current) => current.filter((item) => item.id !== edu.id))} aria-label={`Eliminar ${edu.degree}`} className="p-2 rounded-button text-on-surface-variant hover:bg-error-container/20 hover:text-error"><Trash2 size={17} /></button>
                  </div>
                </Card>
              ))}
              {education.length === 0 && <Card className="text-center text-body-md text-on-surface-variant">Aún no agregas estudios. Añade tu formación para completar el perfil.</Card>}
            </div>
          </div>
        )}

        {/* Sección: Experiencia Laboral */}
        {activeTab === tabs[2] && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md text-on-surface">Experiencia Laboral</h3>
              <Button type="button" variant="ghost" className="text-primary" onClick={() => setModal('experience')}>+ Añadir Experiencia</Button>
            </div>
            <div className="relative border-l-2 border-surface-container-highest ml-4 pl-8 flex flex-col gap-8">
              {experience.map((exp) => (
                <div key={exp.id} className="relative">
                  <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-2 border-background bg-primary"></span>
                  <Card>
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-body-lg font-semibold text-on-surface">{exp.role}</h4>
                          {exp.isCurrent && <Badge variant="success">Actual</Badge>}
                        </div>
                        <p className="text-body-md text-on-surface-variant">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                        {exp.employmentType && <p className="text-label-sm text-on-surface-variant mt-1">{exp.employmentType}</p>}
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
                    <div className="mt-3 flex justify-end">
                      <button type="button" onClick={() => setExperience((current) => current.filter((item) => item.id !== exp.id))} aria-label={`Eliminar experiencia ${exp.role}`} className="p-2 rounded-button text-on-surface-variant hover:bg-error-container/20 hover:text-error"><Trash2 size={17} /></button>
                    </div>
                  </Card>
                </div>
              ))}
              {experience.length === 0 && <Card className="-ml-8 text-center text-body-md text-on-surface-variant">Aún no agregas experiencia laboral. Añade tus cargos y logros profesionales.</Card>}
            </div>
          </div>
        )}

        {/* Sección: Habilidades & Keywords */}
        {activeTab === tabs[3] && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md text-on-surface">Habilidades & Keywords</h3>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => { setModal('skills'); setCatalogSearch(''); }}>+ Agregar habilidad</Button>
                <Button type="button" variant="ghost" className="text-primary" onClick={() => { setModal('keywords'); setCatalogSearch(''); }}>+ Agregar keyword</Button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Card>
                <h4 className="text-body-lg font-semibold text-on-surface mb-4">Habilidades técnicas <span className="text-label-sm font-normal text-on-surface-variant">({skills.length})</span></h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => <button key={skill} type="button" onClick={() => setSkills((current) => current.filter((item) => item !== skill))} className="inline-flex items-center gap-2 rounded-pill bg-primary-container px-3 py-1.5 text-label-sm text-on-primary-container hover:bg-error-container/30" aria-label={`Quitar habilidad ${skill}`}>{skill}<X size={14} /></button>)}
                  {skills.length === 0 && <p className="text-body-md text-on-surface-variant">Selecciona las tecnologías y herramientas que dominas.</p>}
                </div>
              </Card>
              <Card>
                <h4 className="text-body-lg font-semibold text-on-surface mb-4">Keywords para tu CV <span className="text-label-sm font-normal text-on-surface-variant">({keywords.length})</span></h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => <button key={keyword} type="button" onClick={() => setKeywords((current) => current.filter((item) => item !== keyword))} className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface-container-low px-3 py-1.5 text-label-sm text-on-surface hover:border-primary" aria-label={`Quitar keyword ${keyword}`}>{keyword}<X size={14} /></button>)}
                  {keywords.length === 0 && <p className="text-body-md text-on-surface-variant">Agrega conceptos de especialidad, impacto y herramientas para mejorar el matching de tu perfil.</p>}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Sección: Pretensiones Salariales */}
        {activeTab === tabs[4] && (
          <div>
            <h3 className="text-headline-md text-on-surface mb-4">Pretensiones Salariales</h3>
            <Card className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">Moneda</label>
                  <select value={salaryData.currency} onChange={(e) => handleSalaryChange('currency', e.target.value)} className="w-full rounded-input border border-border bg-surface-container-low px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="CLP">Peso chileno (CLP)</option><option value="UF">Unidad de Fomento (UF)</option><option value="USD">Dólar estadounidense (USD)</option><option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">Periodicidad</label>
                  <select value={salaryData.period} onChange={(e) => handleSalaryChange('period', e.target.value)} className="w-full rounded-input border border-border bg-surface-container-low px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Mensual</option><option>Anual</option><option>Por hora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">
                    Rango mínimo ({salaryData.currency})
                  </label>
                  <Input type="number" min="0" step="any" placeholder="2500000" value={salaryData.min} onChange={(e) => handleSalaryChange('min', e.target.value)} />
                </div>
                <div>
                  <label className="block text-label-md font-semibold mb-2 text-on-surface">
                    Rango máximo ({salaryData.currency})
                  </label>
                  <Input type="number" min="0" step="any" placeholder="5000000" value={salaryData.max} onChange={(e) => handleSalaryChange('max', e.target.value)} />
                </div>
                <label className="sm:col-span-2 flex items-start gap-3 text-body-md text-on-surface"><input type="checkbox" checked={salaryData.negotiable} onChange={(e) => setSalaryData((current) => ({ ...current, negotiable: e.target.checked }))} className="mt-1 accent-primary" />Estoy dispuesto/a a conversar la oferta según responsabilidades y beneficios.</label>
              </div>
              {salaryRangeInvalid && <p className="mt-4 text-label-md text-error">El rango máximo debe ser igual o mayor que el mínimo.</p>}
              <p className="mt-4 text-label-sm text-on-surface-variant">Puedes dejar un extremo vacío si prefieres no especificarlo. Estos datos se guardan en este dispositivo.</p>
            </Card>
          </div>
        )}

        {/* Acciones Finales */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-4 pt-6 border-t border-border">
          <p aria-live="polite" className="text-label-sm text-on-surface-variant">{savedAt ? `Guardado a las ${savedAt}` : 'Los cambios se guardan automáticamente en este dispositivo.'}</p>
          <Button type="button" variant="primary" disabled={salaryRangeInvalid} onClick={saveProfile}>Guardar Cambios</Button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-container border border-border bg-surface-container-lowest shadow-xl">
            <header className="flex items-start justify-between gap-4 border-b border-border bg-surface-container-low px-6 py-5">
              <div>
                <h2 id="profile-modal-title" className="text-headline-sm text-on-surface">
                  {modal === 'education' ? 'Añadir educación' : modal === 'experience' ? 'Añadir experiencia laboral' : modal === 'skills' ? 'Agregar habilidades técnicas' : 'Agregar keywords profesionales'}
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {modal === 'education' ? 'Completa los datos de tu formación académica.' : modal === 'experience' ? 'Registra un cargo y sus principales responsabilidades.' : 'Busca en el catálogo o agrega un término propio.'}
                </p>
              </div>
              <button type="button" onClick={() => setModal(null)} aria-label="Cerrar" className="rounded-button p-2 text-on-surface-variant hover:bg-surface-container"><X size={20} /></button>
            </header>

            {modal === 'education' && (
              <form onSubmit={handleEducationSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="grid gap-4 overflow-y-auto p-6 sm:grid-cols-2">
                  <label className="text-label-md text-on-surface">Título o programa<Input required value={educationForm.degree} onChange={(e) => setEducationForm((current) => ({ ...current, degree: e.target.value }))} placeholder="Ingeniería Civil Informática" /></label>
                  <label className="text-label-md text-on-surface">Institución<Input required value={educationForm.institution} onChange={(e) => setEducationForm((current) => ({ ...current, institution: e.target.value }))} placeholder="Universidad o centro de estudios" /></label>
                  <label className="text-label-md text-on-surface">Fecha de inicio<Input required type="month" value={educationForm.startDate} onChange={(e) => setEducationForm((current) => ({ ...current, startDate: e.target.value }))} /></label>
                  <label className="text-label-md text-on-surface">Fecha de término<Input required={!educationForm.studying} disabled={educationForm.studying} type="month" value={educationForm.endDate} onChange={(e) => setEducationForm((current) => ({ ...current, endDate: e.target.value }))} /></label>
                  <label className="text-label-md text-on-surface">Modalidad<select value={educationForm.studyMode} onChange={(e) => setEducationForm((current) => ({ ...current, studyMode: e.target.value }))} className="mt-2 w-full rounded-input border border-border bg-surface-container-low px-4 py-3 text-on-surface"><option>Presencial</option><option>Híbrida</option><option>En línea</option></select></label>
                  <label className="text-label-md text-on-surface">Ciudad o país<Input value={educationForm.location} onChange={(e) => setEducationForm((current) => ({ ...current, location: e.target.value }))} placeholder="Santiago, Chile" /></label>
                  <label className="sm:col-span-2 flex items-center gap-3 text-body-md text-on-surface"><input type="checkbox" checked={educationForm.studying} onChange={(e) => setEducationForm((current) => ({ ...current, studying: e.target.checked }))} className="accent-primary" />Actualmente estudiando</label>
                  <label className="sm:col-span-2 text-label-md text-on-surface">Especialidades o asignaturas, separadas por coma<Input value={educationForm.tags} onChange={(e) => setEducationForm((current) => ({ ...current, tags: e.target.value }))} placeholder="Desarrollo de software, bases de datos" /></label>
                  <label className="sm:col-span-2 text-label-md text-on-surface">Descripción<textarea rows={3} value={educationForm.description} onChange={(e) => setEducationForm((current) => ({ ...current, description: e.target.value }))} placeholder="Proyectos, reconocimientos o contenidos relevantes" className="mt-2 w-full rounded-input border border-border bg-surface-container-low px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none" /></label>
                </div>
                <div className="flex justify-end gap-3 border-t border-border bg-surface-container-low p-5"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">Agregar educación</Button></div>
              </form>
            )}

            {modal === 'experience' && (
              <form onSubmit={handleExperienceSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="grid gap-4 overflow-y-auto p-6 sm:grid-cols-2">
                  <label className="text-label-md text-on-surface">Cargo<Input required value={experienceForm.role} onChange={(e) => setExperienceForm((current) => ({ ...current, role: e.target.value }))} placeholder="Desarrollador/a Full Stack" /></label>
                  <label className="text-label-md text-on-surface">Empresa<Input required value={experienceForm.company} onChange={(e) => setExperienceForm((current) => ({ ...current, company: e.target.value }))} placeholder="Nombre de la organización" /></label>
                  <label className="text-label-md text-on-surface">Fecha de inicio<Input required type="month" value={experienceForm.startDate} onChange={(e) => setExperienceForm((current) => ({ ...current, startDate: e.target.value }))} /></label>
                  <label className="text-label-md text-on-surface">Fecha de término<Input required={!experienceForm.isCurrent} disabled={experienceForm.isCurrent} type="month" value={experienceForm.endDate} onChange={(e) => setExperienceForm((current) => ({ ...current, endDate: e.target.value }))} /></label>
                  <label className="text-label-md text-on-surface">Tipo de jornada<select value={experienceForm.employmentType} onChange={(e) => setExperienceForm((current) => ({ ...current, employmentType: e.target.value }))} className="mt-2 w-full rounded-input border border-border bg-surface-container-low px-4 py-3 text-on-surface"><option>Jornada completa</option><option>Media jornada</option><option>Contrato</option><option>Freelance</option><option>Práctica profesional</option></select></label>
                  <label className="text-label-md text-on-surface">Ubicación o modalidad<Input value={experienceForm.location} onChange={(e) => setExperienceForm((current) => ({ ...current, location: e.target.value }))} placeholder="Santiago · Híbrido" /></label>
                  <label className="sm:col-span-2 flex items-center gap-3 text-body-md text-on-surface"><input type="checkbox" checked={experienceForm.isCurrent} onChange={(e) => setExperienceForm((current) => ({ ...current, isCurrent: e.target.checked }))} className="accent-primary" />Trabajo actualmente aquí</label>
                  <label className="sm:col-span-2 text-label-md text-on-surface">Responsabilidades y logros<textarea required rows={4} value={experienceForm.description} onChange={(e) => setExperienceForm((current) => ({ ...current, description: e.target.value }))} placeholder="Describe tu aporte e incluye resultados cuando sea posible." className="mt-2 w-full rounded-input border border-border bg-surface-container-low px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none" /></label>
                  <label className="sm:col-span-2 text-label-md text-on-surface">Tecnologías y habilidades, separadas por coma<Input value={experienceForm.stackTags} onChange={(e) => setExperienceForm((current) => ({ ...current, stackTags: e.target.value }))} placeholder="React, TypeScript, AWS" /></label>
                </div>
                <div className="flex justify-end gap-3 border-t border-border bg-surface-container-low p-5"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">Agregar experiencia</Button></div>
              </form>
            )}

            {(modal === 'skills' || modal === 'keywords') && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-4 overflow-y-auto p-6">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <Input autoFocus value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} placeholder="Buscar en el catálogo..." className="pl-10" />
                  </div>
                  <form onSubmit={(event) => { event.preventDefault(); addCustomCatalogValue(); }} className="flex gap-2">
                    <Input value={customCatalogValue} onChange={(e) => setCustomCatalogValue(e.target.value)} placeholder={modal === 'skills' ? 'Agregar una tecnología personalizada' : 'Agregar una keyword personalizada'} />
                    <Button type="submit" variant="secondary">Agregar</Button>
                  </form>
                  <p className="text-label-sm text-on-surface-variant">{selectedCatalogValues.length} seleccionadas</p>
                  <div className="space-y-5">
                    {filteredCatalog.map(({ category, values }) => (
                      <section key={category}>
                        <h3 className="mb-2 text-label-lg font-semibold text-on-surface">{category}</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {values.map((value) => (
                            <label key={value} className="flex cursor-pointer items-center gap-3 rounded-input border border-border px-3 py-2.5 text-body-sm text-on-surface hover:bg-surface-container-low">
                              <input type="checkbox" checked={selectedCatalogValues.includes(value)} onChange={() => toggleCatalogValue(value)} className="accent-primary" />{value}
                            </label>
                          ))}
                        </div>
                      </section>
                    ))}
                    {filteredCatalog.length === 0 && <p className="py-8 text-center text-body-md text-on-surface-variant">No encontramos coincidencias. Puedes agregarlo como término personalizado.</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border bg-surface-container-low p-5"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cerrar</Button><Button type="button" onClick={() => setModal(null)}>Listo ({selectedCatalogValues.length})</Button></div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
