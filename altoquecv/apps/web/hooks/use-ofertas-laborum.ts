'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export interface OfertaLaborum {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  url: string;
  notas_usuario: string;
  compatibilidad: number;
  habilidades_coincidentes: string[];
  habilidades_totales: number;
  skills_match: number;
  experiencia_match: number;
  formacion_match: number;
  fecha_captura: string;
}

export function useOfertasLaborum() {
  const { accessToken } = useAuth();
  const [ofertas, setOfertas] = useState<OfertaLaborum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    if (!accessToken) {
      setOfertas([]);
      setIsLoading(false);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/ofertas-laborum`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : 'No se pudieron cargar las ofertas.';
        throw new Error(detail);
      }
      setOfertas(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las ofertas.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void recargar();
    window.addEventListener('focus', recargar);
    return () => window.removeEventListener('focus', recargar);
  }, [recargar]);

  const eliminarOferta = async (id: string) => {
    if (!accessToken) return false;
    const response = await fetch(`${API_URL}/auth/ofertas-laborum/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      setError('No se pudo quitar la oferta guardada.');
      return false;
    }
    setOfertas((current) => current.filter((offer) => offer.id !== id));
    return true;
  };

  const guardarOferta = async (oferta: Pick<OfertaLaborum, 'titulo' | 'empresa' | 'ubicacion' | 'url' | 'notas_usuario'>) => {
    if (!accessToken) {
      setError('Inicia sesión para guardar una oferta.');
      return false;
    }
    try {
      const response = await fetch(`${API_URL}/auth/ofertas-laborum`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ofertas: [oferta] }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.detail === 'string' ? data.detail : 'No se pudo guardar la oferta.');
      }
      await recargar();
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la oferta.');
      return false;
    }
  };

  return { ofertas, isLoading, error, recargar, guardarOferta, eliminarOferta };
}
