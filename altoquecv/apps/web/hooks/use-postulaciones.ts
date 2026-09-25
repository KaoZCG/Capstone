import { useState, useEffect } from 'react';
import { Postulacion, PostulacionStatus } from '@/types';
import { useAuth } from './use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export function usePostulaciones() {
  const { accessToken } = useAuth();
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPostulaciones() {
      if (!accessToken) {
        setPostulaciones([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/postulaciones`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error('No fue posible cargar las postulaciones');
        const data = await response.json();
        if (!cancelled) setPostulaciones(data);
      } catch {
        if (!cancelled) setPostulaciones([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPostulaciones();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const movePostulacion = async (id: string, nuevoStatus: PostulacionStatus) => {
    if (!accessToken) return;
    const response = await fetch(`${API_URL}/auth/postulaciones/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: nuevoStatus }),
    });
    if (!response.ok) return;
    setPostulaciones((prev) => prev.map((postulacion) =>
      postulacion.id === id ? { ...postulacion, status: nuevoStatus } : postulacion
    ));
  };

  const deletePostulacion = async (id: string) => {
    if (!accessToken) return;
    const response = await fetch(`${API_URL}/auth/postulaciones/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return;
    setPostulaciones((prev) => prev.filter((postulacion) => postulacion.id !== id));
  };

  const getByStatus = (status: PostulacionStatus) =>
    postulaciones.filter((p) => p.status === status);

  const search = (query: string) => {
    if (!query.trim()) return postulaciones;
    const q = query.toLowerCase();
    return postulaciones.filter(
      (p) =>
        p.empresa.nombre.toLowerCase().includes(q) ||
        p.cargo.toLowerCase().includes(q)
    );
  };

  return {
    postulaciones,
    isLoading,
    movePostulacion,
    deletePostulacion,
    getByStatus,
    search,
  };
}