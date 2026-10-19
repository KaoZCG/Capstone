'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CV, CVSkill } from '@/types';
import { clearStorage, loadFromStorage, saveToStorage } from '@/lib/storage';
import { useAuth } from './use-auth';
import { useProfile, type ProfileData } from './use-profile';
import type { Education, Experience } from '@/types/perfil';

interface LocalMasterProfile {
  personalData?: {
    nombre?: string;
    email?: string;
    teléfono?: string;
    cargoObjetivo?: string;
    resumen?: string;
  };
  education?: Education[];
  experience?: Experience[];
  skills?: string[];
}

function yearFromDate(value?: string | null): number {
  const match = value?.match(/(?:19|20)\d{2}/g);
  return match ? Number(match[match.length - 1]) : 0;
}

function createCVFromProfile(profile: ProfileData): CV {
  return {
    id: profile.user_id,
    nombre: `${profile.first_name} ${profile.last_name}`.trim(),
    email: profile.email,
    teléfono: profile.phone ?? '',
    resumen: '',
    habilidadesPersonalizadas: false,
    experiencias: profile.experience.map((experience) => ({
      empresa: experience.company ?? '',
      cargo: experience.role ?? '',
      fechaInicio: experience.startDate ?? '',
      fechaFin: experience.endDate && experience.endDate !== 'Presente' ? experience.endDate : undefined,
      descripcion: experience.description ?? '',
      habilidades: experience.stackTags ?? [],
    })),
    educación: profile.education.map((education) => ({
      institución: education.institution ?? '',
      grado: education.degree ?? '',
      año: yearFromDate(education.endDate) || yearFromDate(education.startDate),
    })),
    habilidades: profile.skills.map((nombre): CVSkill => ({
      nombre,
      nivel: 'mid',
      categoría: 'técnica',
    })),
    certificaciones: [],
  };
}

function createCVFromUser(user: { id: string; nombre: string; email: string; teléfono: string; rut: string }): CV {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    teléfono: user.teléfono,
    resumen: '',
    habilidadesPersonalizadas: false,
    experiencias: [],
    educación: [],
    habilidades: [],
    certificaciones: [],
  };
}

function applyLocalMasterProfile(cv: CV, master: LocalMasterProfile | null): CV {
  if (!master) return cv;
  const personalData = master.personalData ?? {};

  return {
    ...cv,
    nombre: personalData.nombre?.trim() || cv.nombre,
    email: personalData.email ?? cv.email,
    teléfono: personalData.teléfono ?? cv.teléfono,
    cargoObjetivo: personalData.cargoObjetivo ?? cv.cargoObjetivo,
    resumen: personalData.resumen ?? cv.resumen,
    experiencias: Array.isArray(master.experience)
      ? master.experience.map((experience) => ({
        empresa: experience.company ?? '',
        cargo: experience.role ?? '',
        fechaInicio: experience.startDate ?? '',
        fechaFin: experience.endDate && experience.endDate !== 'Presente' ? experience.endDate : undefined,
        descripcion: experience.description ?? '',
        habilidades: experience.stackTags ?? [],
      }))
      : cv.experiencias,
    educación: Array.isArray(master.education)
      ? master.education.map((education) => ({
        institución: education.institution ?? '',
        grado: education.degree ?? '',
        año: yearFromDate(education.endDate) || yearFromDate(education.startDate),
      }))
      : cv.educación,
    habilidades: Array.isArray(master.skills)
      ? master.skills.map((nombre): CVSkill => ({
        nombre,
        nivel: 'mid',
        categoría: 'técnica',
      }))
      : cv.habilidades,
  };
}

function isSavedCV(value: unknown): value is CV {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CV>;
  return typeof candidate.nombre === 'string'
    && Array.isArray(candidate.experiencias)
    && Array.isArray(candidate.educación)
    && Array.isArray(candidate.habilidades);
}

export function useCVAnalyzer() {
  const { usuario } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const [cv, setCV] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const ownerId = profile?.user_id ?? usuario?.id ?? usuario?.email;
  const storageKey = ownerId ? `altoquecv_cv:${ownerId}` : null;
  const masterOwnerId = profile?.user_id ?? usuario?.email ?? 'local';
  const masterStorageKey = `altoquecv-profile:${masterOwnerId}`;

  useEffect(() => {
    if (isProfileLoading) return;

    if (!storageKey) {
      setCV(null);
      setIsLoading(false);
      return;
    }

    const refreshCV = () => {
      const savedMaster = loadFromStorage<LocalMasterProfile>(masterStorageKey);
      const baseCV = profile
        ? createCVFromProfile(profile)
        : usuario
          ? createCVFromUser(usuario)
          : null;
      const masterCV = baseCV ? applyLocalMasterProfile(baseCV, savedMaster) : null;
      const savedCV = loadFromStorage<unknown>(storageKey);
      const nextCV = isSavedCV(savedCV)
        ? {
          ...savedCV,
          habilidades: savedCV.habilidadesPersonalizadas
            ? savedCV.habilidades
            : masterCV?.habilidades ?? savedCV.habilidades,
          habilidadesPersonalizadas: savedCV.habilidadesPersonalizadas ?? false,
        }
        : masterCV;

      setCV(nextCV);
      if (nextCV && !isSavedCV(savedCV)) saveToStorage(storageKey, nextCV);
    };

    refreshCV();
    setIsLoading(false);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === masterStorageKey) refreshCV();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isProfileLoading, masterStorageKey, profile, storageKey, usuario]);

  const updateCV = useCallback((updatedCV: CV) => {
    setCV(updatedCV);
    if (storageKey) saveToStorage(storageKey, updatedCV);
  }, [storageKey]);

  const resetCV = useCallback(() => {
    if (storageKey) clearStorage(storageKey);
    const baseCV = profile
      ? createCVFromProfile(profile)
      : usuario
        ? createCVFromUser(usuario)
        : null;
    const master = loadFromStorage<LocalMasterProfile>(masterStorageKey);
    const profileCV = baseCV ? applyLocalMasterProfile(baseCV, master) : null;
    setCV(profileCV);
    if (profileCV && storageKey) saveToStorage(storageKey, profileCV);
  }, [masterStorageKey, profile, storageKey, usuario]);

  return { cv, isLoading: isLoading || isProfileLoading, updateCV, resetCV };
}
