"use client";

import { PhoneInput } from '@/components/ui/PhoneInput';
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { Education, Experience } from '@/types/perfil';
import { PROFILE_KEYWORD_CATEGORIES, TECHNICAL_SKILL_CATEGORIES } from '@/lib/profile-catalogs';
import { getNationalPhoneNumber, toInternationalPhoneNumber } from '@/lib/auth';
import chileLocations from '@/lib/chile-locations.json';
import { Download, FileText, Pencil, Search, Trash2, UserRound, X } from 'lucide-react';
import CargadorCV from '@/components/perfil-maestro/CargadorCV';
import { deleteOriginalProfileCV, loadOriginalProfileCV, type StoredProfileCV } from '@/lib/profile-cv-storage';
import { useProfileAvatar } from '@/hooks/use-profile-avatar';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

type ProfileModal = 'education' | 'experience' | 'skills' | 'keywords' | 'confirmClear' | null;

const CHILE_REGIONS = chileLocations.regions;

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function normalizeExperiencePart(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('es-CL');
}

function isOnlyExperienceSectionNoise(role: string | undefined): boolean {
  const words = normalizeExperiencePart(role).match(/[a-z0-9]+/g) ?? [];
  const sectionLabels = new Set([
    'academica',
    'academicas',
    'academico',
    'academicos',
    'destacable',
    'experiencia',
    'formacion',
    'laboral',
    'profesional',
  ]);
  return words.length === 0 || words.every((word) => sectionLabels.has(word));
}

function deduplicateExperiences(items: Experience[]): Experience[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [
      item.company,
      item.role,
      item.startDate,
      item.endDate === 'Presente' ? 'presente' : item.endDate,
    ].map(normalizeExperiencePart).join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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
  const { usuario, accessToken, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading, error: profileLoadError } = useProfile();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [modal, setModal] = useState<ProfileModal>(null);
  const [educationForm, setEducationForm] = useState(emptyEducationForm);
  const [experienceForm, setExperienceForm] = useState(emptyExperienceForm);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customCatalogValue, setCustomCatalogValue] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const [savedOriginalCV, setSavedOriginalCV] = useState<StoredProfileCV | null>(null);
  const [isLoadingOriginalCV, setIsLoadingOriginalCV] = useState(true);
  const [hasProcessedCV, setHasProcessedCV] = useState(false);
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [isClearingProfile, setIsClearingProfile] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hydratedKey, setHydratedKey] = useState('');
  const storageKey = `altoquecv-profile:${profile?.user_id ?? usuario?.email ?? 'local'}`;
  const cvOwnerId = profile?.user_id ?? usuario?.id ?? usuario?.email ?? 'local';
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState('');
  const { avatarUrl, updateAvatar } = useProfileAvatar(cvOwnerId);

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

    let saved: Record<string, any> | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    } catch (error) {
      console.error('No se pudo leer el perfil guardado en este navegador:', error);
    }
    const savedPersonalData = saved?.personalData ?? {};
    const savedSalaryData = saved?.salaryData ?? {};
    const countryCode = savedPersonalData.codigoTeléfono || '+56';
    const defaults = {
      ...personalData,
      nombre: profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : savedPersonalData.nombre ?? usuario?.nombre ?? '',
      rut: profile?.rut ?? savedPersonalData.rut ?? usuario?.rut ?? '',
      email: profile?.email ?? savedPersonalData.email ?? usuario?.email ?? '',
      teléfono: getNationalPhoneNumber(
        profile ? profile.phone ?? '' : savedPersonalData.teléfono ?? usuario?.teléfono ?? '',
        countryCode,
      ),
    };

    setPersonalData({
      ...savedPersonalData,
      ...defaults,
      nombre: profile ? defaults.nombre : savedPersonalData.nombre ?? defaults.nombre,
      rut: profile ? defaults.rut : savedPersonalData.rut?.trim() || defaults.rut,
      email: profile ? defaults.email : savedPersonalData.email ?? defaults.email,
      teléfono: profile
        ? defaults.teléfono
        : getNationalPhoneNumber(savedPersonalData.teléfono ?? defaults.teléfono, countryCode),
      codigoTeléfono: countryCode,
    });
    setEducation(profile?.education ?? saved?.education ?? []);
    setExperience(deduplicateExperiences(profile?.experience ?? saved?.experience ?? []));
    setSkills(profile?.skills ?? saved?.skills ?? []);
    setKeywords(saved?.keywords ?? []);
    setSalaryData({
      ...initialSalaryData,
      ...savedSalaryData,
      min: profile ? profile.salary_min?.toString() ?? '' : savedSalaryData.min ?? '',
      max: savedSalaryData.max ?? profile?.salary_max?.toString() ?? '',
    });
    setHydratedKey(storageKey);
  }, [isLoading, profile, storageKey, usuario]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingOriginalCV(true);
    setSavedOriginalCV(null);

    loadOriginalProfileCV(cvOwnerId)
      .then((file) => {
        if (!cancelled) {
          setSavedOriginalCV(file);
          setHasProcessedCV(Boolean(file));
          try {
            setHasProcessedCV(Boolean(file) || localStorage.getItem(`${storageKey}:cv-processed`) === '1');
          } catch (error) {
            console.error('No se pudo consultar el estado local de importación del CV:', error);
          }
        }
      })
      .catch((error) => {
        console.error('No se pudo cargar el CV original guardado:', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOriginalCV(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cvOwnerId, storageKey]);

  const downloadOriginalCV = () => {
    if (!savedOriginalCV) return;
    const objectUrl = URL.createObjectURL(savedOriginalCV.blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = savedOriginalCV.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

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

// Atrapa los datos de la IA y actualiza todos los estados de React a la vez
  const handleDatosExtraidosIA = (datosIA: any) => {
    setHasProcessedCV(true);
    try {
      localStorage.setItem(`${storageKey}:cv-processed`, '1');
    } catch (error) {
      console.error('No se pudo guardar el estado de importación del CV:', error);
    }

    if (datosIA.personalData) {
      setPersonalData((previous) => ({
        ...previous,
        ...datosIA.personalData,
        rut: datosIA.personalData.rut?.trim() || previous.rut,
        teléfono: getNationalPhoneNumber(
          datosIA.personalData.teléfono ?? previous.teléfono,
          previous.codigoTeléfono,
        ),
        resumen: datosIA.personalData.resumen?.trim() || previous.resumen,
      }));
    }

    if (datosIA.skills && Array.isArray(datosIA.skills)) {
      setSkills(prev => Array.from(new Set([...prev, ...datosIA.skills])));
    }

    if (datosIA.keywords && Array.isArray(datosIA.keywords)) {
      setKeywords(prev => Array.from(new Set([...prev, ...datosIA.keywords])));
    }

    if (datosIA.salaryData) {
      setSalaryData(prev => ({ ...prev, ...datosIA.salaryData }));
    }


    const experienceEntries = Array.isArray(datosIA.experience)
      ? datosIA.experience
      : Array.isArray(datosIA.experiencia) ? datosIA.experiencia : [];
    if (experienceEntries.length > 0) {
      const nuevasExperiencias = experienceEntries
        .filter((exp: any) => exp && typeof exp === 'object')
        .map((exp: any): Experience => {
          const endDate = exp.fecha_fin ?? exp.endDate ?? exp.end_date ?? '';
          const isCurrent = exp.actual === true || exp.isCurrent === true || /presente|actualidad/i.test(String(endDate));
          const stackTags = exp.habilidades ?? exp.stackTags ?? exp.technologies ?? [];
          return {
            id: crypto.randomUUID(),
            role: exp.cargo || exp.role || exp.puesto || '',
            company: exp.empresa || exp.company || exp.compania || '',
            startDate: exp.fecha_inicio || exp.startDate || exp.start_date || '',
            endDate: isCurrent ? 'Presente' : endDate,
            isCurrent,
            location: exp.ubicacion || exp.location || '',
            employmentType: exp.tipo_jornada || exp.employmentType || '',
            description: exp.descripcion || exp.description || exp.responsabilidades || '',
            stackTags: Array.isArray(stackTags)
              ? stackTags.filter((tag: unknown): tag is string => typeof tag === 'string')
              : typeof stackTags === 'string' ? stackTags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
          };
        })
        .filter((exp: Experience) => exp.role || exp.company);
      const empresasImportadas = new Set(nuevasExperiencias.map((exp: Experience) => normalizeExperiencePart(exp.company)));
      setExperience((previous) => {
        const experienciasPrevias = previous.filter((exp: Experience) => (
          !empresasImportadas.has(normalizeExperiencePart(exp.company))
          || !isOnlyExperienceSectionNoise(exp.role)
        ));
        return deduplicateExperiences([...nuevasExperiencias, ...experienciasPrevias]);
      });
    }


    const educationEntries = Array.isArray(datosIA.education)
      ? datosIA.education
      : Array.isArray(datosIA.educacion) ? datosIA.educacion : [];
    if (educationEntries.length > 0) {
      const nuevaEducacion = educationEntries.filter((edu: any) => edu && typeof edu === 'object').map((edu: any) => ({
        id: crypto.randomUUID(),
        institution: edu.institucion || edu.institution || '',
        degree: edu.titulo || edu.degree || edu.grado || '',
        startDate: edu.fecha_inicio || edu.startDate || edu.start_date || '',
        endDate: edu.fecha_fin || edu.endDate || edu.end_date || '',
        studying: edu.actual === true || edu.studying === true,
        location: edu.ubicacion || edu.location || '',
        studyMode: 'Presencial',
        description: edu.descripcion || edu.description || 'Formación detectada automáticamente desde tu CV.',
        tags: Array.isArray(edu.habilidades) ? edu.habilidades.filter((tag: unknown): tag is string => typeof tag === 'string') : [],
      })).filter((edu: Education) => edu.institution || edu.degree);
      setEducation(prev => [...prev, ...nuevaEducacion]);
    }

    setSavedAt(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
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
    const updatedExperience: Experience = {
      id: editingExperienceId ?? crypto.randomUUID(),
      role: experienceForm.role.trim(),
      company: experienceForm.company.trim(),
      startDate: experienceForm.startDate,
      endDate: experienceForm.isCurrent ? 'Presente' : experienceForm.endDate,
      isCurrent: experienceForm.isCurrent,
      description: experienceForm.description.trim(),
      stackTags: experienceForm.stackTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      location: experienceForm.location.trim(),
      employmentType: experienceForm.employmentType,
    };
    setExperience((current) => deduplicateExperiences(
      editingExperienceId
        ? current.map((item) => item.id === editingExperienceId ? updatedExperience : item)
        : [updatedExperience, ...current],
    ));
    setExperienceForm(emptyExperienceForm);
    setEditingExperienceId(null);
    setModal(null);
  };

  const openExperienceEditor = (experienceItem: Experience) => {
    setEditingExperienceId(experienceItem.id);
    setExperienceForm({
      role: experienceItem.role,
      company: experienceItem.company,
      startDate: experienceItem.startDate,
      endDate: experienceItem.isCurrent || experienceItem.endDate === 'Presente' ? '' : experienceItem.endDate,
      isCurrent: experienceItem.isCurrent || experienceItem.endDate === 'Presente',
      location: experienceItem.location ?? '',
      employmentType: experienceItem.employmentType ?? 'Jornada completa',
      description: experienceItem.description,
      stackTags: experienceItem.stackTags.join(', '),
    });
    setModal('experience');
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

  const saveProfile = async () => {
    const perfilLocal = {
      personalData,
      education,
      experience,
      skills,
      keywords,
      salaryData,
    };
    localStorage.setItem(storageKey, JSON.stringify(perfilLocal));
    setSaveError('');

    if (!accessToken) {
      setSaveError('Se guardó en este dispositivo, pero debes iniciar sesión para sincronizarlo.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...perfilLocal,
          personalData: {
            ...personalData,
            teléfono: toInternationalPhoneNumber(personalData.teléfono, personalData.codigoTeléfono),
          },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.detail || 'No fue posible sincronizar el Perfil Maestro.');
      }
      setSavedAt(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      setSaveError(error instanceof Error
        ? `Se guardó en este dispositivo, pero no se sincronizó: ${error.message}`
        : 'Se guardó en este dispositivo, pero no se sincronizó con el servidor.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const requestClearProfileData = () => {
    setModal('confirmClear');
  };

  const executeClearProfileData = async () => {
    setIsClearingProfile(true);
    setSaveError('');
    const errors: string[] = [];
    const clearedProfile = {
      personalData: {
        nombre: personalData.nombre,
        rut: personalData.rut,
        email: personalData.email,
        teléfono: personalData.teléfono,
        codigoTeléfono: personalData.codigoTeléfono,
        // Limpiamos los campos adicionales
        región: '',
        comuna: '',
        cargoObjetivo: '',
        linkedin: '',
        portafolio: '',
        resumen: '',
      },
      education: [],
      experience: [],
      skills: [],
      keywords: [],
      salaryData: initialSalaryData,
    };

    setPersonalData(clearedProfile.personalData);
    setEducation(clearedProfile.education);
    setExperience(clearedProfile.experience);
    setSkills(clearedProfile.skills);
    setKeywords(clearedProfile.keywords);
    setSalaryData(clearedProfile.salaryData);
    setEducationForm(emptyEducationForm);
    setExperienceForm(emptyExperienceForm);
    setSavedAt('');

    try {
      localStorage.setItem(storageKey, JSON.stringify(clearedProfile));
      localStorage.removeItem(`altoquecv_cv:${cvOwnerId}`);
    } catch (error) {
      console.error('No se pudieron limpiar los datos locales del Perfil Maestro:', error);
      errors.push('no se pudieron guardar o limpiar todos los datos locales');
    }

    try {
      await deleteOriginalProfileCV(cvOwnerId);
      setSavedOriginalCV(null);
      setHasProcessedCV(false);
      try {
        localStorage.removeItem(`${storageKey}:cv-processed`);
      } catch (error) {
        console.error('No se pudo limpiar el estado local de importación del CV:', error);
        errors.push('no se pudo limpiar el indicador local de CV importado');
      }
    } catch (error) {
      console.error('No se pudo borrar el CV original guardado:', error);
      errors.push('no se pudo eliminar la copia del CV de este navegador');
    }

    if (accessToken) {
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...clearedProfile,
            personalData: {
              ...clearedProfile.personalData,
              teléfono: toInternationalPhoneNumber(
                clearedProfile.personalData.teléfono,
                clearedProfile.personalData.codigoTeléfono,
              ),
            },
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.detail || 'No fue posible sincronizar el borrado con el servidor.');
        }
        setSavedAt(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
      } catch (error) {
        console.error('No se pudo sincronizar el borrado del Perfil Maestro:', error);
        errors.push('el borrado quedó solo en este dispositivo y no se sincronizó con el servidor');
      }
    } else {
      errors.push('el borrado quedó solo en este dispositivo porque no hay una sesión activa');
    }

    setSaveError(errors.length ? `Borrado parcial: ${errors.join('; ')}.` : '');
    setShowDeletePanel(false);
    setModal(null); // Cerramos el modal tras borrar
    setIsClearingProfile(false);
  };

  const catalog = modal === 'skills' ? TECHNICAL_SKILL_CATEGORIES : PROFILE_KEYWORD_CATEGORIES;
  const selectedCatalogValues = modal === 'skills' ? skills : keywords;
  const filteredCatalog = Object.entries(catalog).map(([category, values]) => ({
    category,
    values: values.filter((value) => value.toLowerCase().includes(catalogSearch.trim().toLowerCase())),
  })).filter((entry) => entry.values.length > 0);
  const salaryRangeInvalid = Boolean(salaryData.min && salaryData.max && Number(salaryData.min) > Number(salaryData.max));
  const phoneNumberInvalid = Boolean(personalData.teléfono) && personalData.teléfono.length !== 9;
  const selectedRegion = CHILE_REGIONS.find((region) => region.name === personalData.región);

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
        <div className="mt-5">
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start border border-error/50 !bg-error !text-on-error hover:!bg-error/90"
            onClick={() => setShowDeletePanel(true)}
          >
            <span className="flex items-center gap-2"><Trash2 size={16} /> Borrar datos del perfil</span>
          </Button>
          {showDeletePanel && (
            <section className="mt-3 rounded-container border border-error/40 bg-error-container/10 p-4">
              <h2 className="text-label-lg font-semibold text-error">Borrar contenido curricular</h2>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Se eliminarán educación, experiencia, habilidades, keywords, pretensiones salariales, resumen y la copia local del CV. Nombre, RUT, correo y teléfono se conservarán.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  type="button"
                  className="w-full !bg-error !text-on-error hover:!bg-error/90"
                  onClick={requestClearProfileData}
                >
                  <span className="flex items-center gap-2"><Trash2 size={16} /> Continuar para borrar datos</span>
                </Button>
                <Button type="button" variant="secondary" className="w-full" onClick={() => setShowDeletePanel(false)}>
                  Cancelar
                </Button>
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col gap-8 pb-20">

        {profileLoadError ? (
          <p role="alert" className="rounded-container border border-error/40 bg-error-container/20 p-4 text-body-sm text-error">
            No se pudo consultar el perfil en la base de datos: {profileLoadError} Los datos visibles pueden ser la copia guardada en este navegador. Inicia sesión nuevamente para cargar y sincronizar los datos.
          </p>
        ) : !isAuthLoading && !accessToken ? (
          <p role="status" className="rounded-container border border-border bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
            Estás viendo los datos guardados en este navegador. Inicia sesión para consultar y sincronizar la base de datos.
          </p>
        ) : null}

        <Card className="border border-border p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><FileText size={20} /></div>
              <div className="min-w-0">
                <h2 className="text-label-lg font-semibold text-on-surface">CV original guardado</h2>
                {isLoadingOriginalCV ? (
                  <p className="text-body-sm text-on-surface-variant">Buscando un archivo guardado...</p>
                ) : savedOriginalCV ? (
                  <p className="truncate text-body-sm text-on-surface-variant">
                    {savedOriginalCV.name} · {formatFileSize(savedOriginalCV.size)} · guardado el {new Date(savedOriginalCV.savedAt).toLocaleDateString('es-CL')}
                  </p>
                ) : hasProcessedCV ? (
                  <p className="text-body-sm text-on-surface-variant">CV importado. No se guardó una copia descargable en este navegador.</p>
                ) : (
                  <p className="text-body-sm text-on-surface-variant">Aún no has guardado un CV original en este navegador.</p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              onClick={downloadOriginalCV}
              disabled={!savedOriginalCV}
            >
              <span className="flex items-center gap-2"><Download size={16} /> Descargar PDF</span>
            </Button>
          </div>
        </Card>

        {/* Sección: Datos Personales */}
        {activeTab === tabs[0] && (
          <div className="flex flex-col gap-8">

            {/* 🪄 Cargador inteligente de CV con IA */}
            {isLoadingOriginalCV ? (
              <Card className="p-5 text-body-sm text-on-surface-variant">Comprobando si ya importaste un CV...</Card>
            ) : hasProcessedCV ? (
              <Card className="border border-success/30 bg-success-container/10 p-5">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="mt-0.5 shrink-0 text-success" />
                  <div>
                    <h2 className="text-label-lg font-semibold text-on-surface">CV ya importado</h2>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      Para cargar otro CV, borra los datos de tu perfil.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <CargadorCV
                ownerId={cvOwnerId}
                onDataExtracted={handleDatosExtraidosIA}
                onCVStored={setSavedOriginalCV}
              />
            )}

            {/* Formulario manual original */}
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
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-gray-400 text-white" role="img" aria-label="Avatar genérico">
                        <UserRound size={56} strokeWidth={1.5} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (!file) return;
                      setAvatarError('');
                      try {
                        await updateAvatar(file);
                      } catch (error) {
                        setAvatarError(error instanceof Error ? error.message : 'No se pudo actualizar la foto.');
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" className="text-label-sm" onClick={() => avatarInputRef.current?.click()}>
                    Cambiar foto
                  </Button>
                  {avatarError && <p role="alert" className="mt-2 max-w-40 text-center text-label-sm text-error">{avatarError}</p>}
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
                        placeholder="11.111.111-1"
                        className="flex-1"
                      />
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
                    error={phoneNumberInvalid}
                  />
                  {phoneNumberInvalid && <p className="mt-1 text-label-sm text-error">Ingresa los 9 dígitos nacionales, sin incluir el código de país.</p>}
                </div>
              </div>

              {/* Región y Comuna */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-region" className="block text-label-md font-semibold mb-2 text-on-surface">Región</label>
                  <SearchableSelect
                    id="profile-region"
                    value={personalData.región}
                    options={CHILE_REGIONS.map((region) => region.name)}
                    onChange={(region) => {
                      handlePersonalDataChange('región', region);
                      handlePersonalDataChange('comuna', '');
                    }}
                    placeholder="Busca o selecciona una región"
                  />
                </div>
                <div>
                  <label htmlFor="profile-commune" className="block text-label-md font-semibold mb-2 text-on-surface">Comuna</label>
                  <SearchableSelect
                    id="profile-commune"
                    value={personalData.comuna}
                    options={selectedRegion?.communes ?? []}
                    onChange={(comuna) => handlePersonalDataChange('comuna', comuna)}
                    placeholder={selectedRegion ? "Busca o selecciona una comuna" : "Primero selecciona una región"}
                    disabled={!selectedRegion}
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
              <Button
                type="button"
                variant="ghost"
                className="text-primary"
                onClick={() => {
                  setEditingExperienceId(null);
                  setExperienceForm(emptyExperienceForm);
                  setModal('experience');
                }}
              >
                + Añadir Experiencia
              </Button>
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
                      <button type="button" onClick={() => openExperienceEditor(exp)} aria-label={`Editar experiencia ${exp.role}`} className="p-2 rounded-button text-on-surface-variant hover:bg-primary/10 hover:text-primary"><Pencil size={17} /></button>
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
          <p aria-live="polite" className={`text-label-sm ${saveError ? 'text-error' : 'text-on-surface-variant'}`}>{saveError || (savedAt ? `Sincronizado a las ${savedAt}` : 'Los cambios se guardan automáticamente en este dispositivo.')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="primary" disabled={salaryRangeInvalid || phoneNumberInvalid || isSavingProfile} onClick={saveProfile}>{isSavingProfile ? 'Sincronizando…' : 'Guardar Cambios'}</Button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-container border border-border bg-surface-container-lowest shadow-xl">
            <header className="flex items-start justify-between gap-4 border-b border-border bg-surface-container-low px-6 py-5">
              <div>
                <h2 id="profile-modal-title" className="text-headline-sm text-on-surface">
                  {modal === 'education' ? 'Añadir educación' : modal === 'experience' ? editingExperienceId ? 'Editar experiencia laboral' : 'Añadir experiencia laboral' : modal === 'skills' ? 'Agregar habilidades técnicas' : 'Agregar keywords profesionales'}
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {modal === 'education' ? 'Completa los datos de tu formación académica.' : modal === 'experience' ? 'Registra un cargo y sus principales responsabilidades.' : 'Busca en el catálogo o agrega un término propio.'}
                </p>
              </div>
              <button type="button" onClick={() => { setModal(null); setEditingExperienceId(null); }} aria-label="Cerrar" className="rounded-button p-2 text-on-surface-variant hover:bg-surface-container"><X size={20} /></button>
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
                <div className="flex justify-end gap-3 border-t border-border bg-surface-container-low p-5"><Button type="button" variant="secondary" onClick={() => { setModal(null); setEditingExperienceId(null); }}>Cancelar</Button><Button type="submit">{editingExperienceId ? 'Guardar cambios' : 'Agregar experiencia'}</Button></div>
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
                          ))
                          }
                        </div>
                      </section>
                    ))}
                    {filteredCatalog.length === 0 && <p className="py-8 text-center text-body-md text-on-surface-variant">No encontramos coincidencias. Puedes agregarlo como término personalizado.</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border bg-surface-container-low p-5"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Cerrar</Button><Button type="button" onClick={() => setModal(null)}>Listo ({selectedCatalogValues.length})</Button></div>
              </div>
            )}
            {modal === 'confirmClear' && (
              <div className="flex flex-col p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-container/30 text-error">
                  <Trash2 size={24} />
                </div>
                <h3 className="mb-2 text-center text-headline-sm text-on-surface">¿Borrar información del perfil?</h3>
                <p className="mb-6 text-center text-body-md text-on-surface-variant">
                  Se eliminarán educación, experiencia laboral, habilidades, keywords, pretensiones salariales, resumen profesional, campos complementarios y la copia local del CV. <br/><br/>
                  <span className="font-semibold text-on-surface">Nombre, RUT, correo y teléfono se conservarán. El borrado también se sincronizará con el servidor.</span>
                </p>
                <div className="flex justify-center gap-3">
                  <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
                  <Button type="button" onClick={executeClearProfileData} disabled={isClearingProfile} className="!bg-error !text-on-error hover:!bg-error/90">
                    {isClearingProfile ? 'Borrando…' : 'Sí, borrar datos'}
                  </Button>
                </div>
              </div>
            )}

          </section>
        </div>
      )}
    </div>
  );
}
