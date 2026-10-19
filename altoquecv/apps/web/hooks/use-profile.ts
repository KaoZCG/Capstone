'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { Education, Experience } from '@/types/perfil';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export interface ProfileData {
  user_id: string;
  email: string;
  account_status: string;
  rut: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  education: Education[];
  experience: Experience[];
  skills: string[];
  salary_min: number | null;
  salary_max: number | null;
}

export function useProfile() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!accessToken) {
        setProfile(null);
        setError('');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.detail || 'No fue posible consultar el perfil en la base de datos.');
        }
        if (!cancelled) setProfile(body);
      } catch (loadError) {
        if (!cancelled) {
          setProfile(null);
          setError(loadError instanceof Error ? loadError.message : 'No fue posible consultar el perfil en la base de datos.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { profile, isLoading, error };
}