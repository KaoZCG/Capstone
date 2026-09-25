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

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!accessToken) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error('No fue posible cargar el perfil');
        const data = await response.json();
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { profile, isLoading };
}