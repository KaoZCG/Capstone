import { useState, useEffect } from 'react';
import { Postulacion, PostulacionStatus } from '@/types';
import { useAuth } from './use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export function usePostulaciones() {
  const { accessToken } = useAuth();
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getResponseError = async (response: Response, fallback: string) => {
    const body = await response.json().catch(() => null);
    const detail = typeof body?.detail === 'string' ? body.detail : '';
    if (/(sql|postgres|postgrest|relation|column|constraint|stack trace)/i.test(detail)) {
      return fallback;
    }
    return detail || fallback;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadPostulaciones() {
      if (!accessToken) {
        setPostulaciones([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/auth/postulaciones`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error(await getResponseError(response, 'No fue posible cargar las postulaciones.'));
        }
        const data = await response.json();
        if (!cancelled) setPostulaciones(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No fue posible conectar con el servidor.');
        }
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
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/postulaciones/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nuevoStatus }),
      });
      if (!response.ok) {
        throw new Error(await getResponseError(response, 'No fue posible actualizar la postulación.'));
      }
      setPostulaciones((prev) => prev.map((postulacion) =>
        postulacion.id === id ? { ...postulacion, status: nuevoStatus } : postulacion
      ));
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : 'No fue posible actualizar la postulación.');
    }
  };

  const createPostulacion = async (input: { cargo: string; empresa: string; url_oferta: string }) => {
    if (!accessToken) throw new Error('Inicia sesión para registrar la postulación.');
    const response = await fetch(`${API_URL}/auth/postulaciones`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(typeof data?.detail === 'string' ? data.detail : 'No fue posible registrar la postulación.');
    }
    const postulacion = data as Postulacion;
    setPostulaciones((prev) => [postulacion, ...prev.filter((item) => item.id !== postulacion.id)]);
    return postulacion;
  };

  const deletePostulacion = async (id: string) => {
    if (!accessToken) return;
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/postulaciones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error(await getResponseError(response, 'No fue posible eliminar la postulación.'));
      }
      setPostulaciones((prev) => prev.filter((postulacion) => postulacion.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No fue posible eliminar la postulación.');
    }
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
    error,
    movePostulacion,
    createPostulacion,
    deletePostulacion,
    getByStatus,
    search,
  };
}
