import { useState, useEffect } from 'react';
import { Postulacion, PostulacionStatus } from '@/types';
import { postulacionesMockFactory } from '@/lib/mock/postulaciones.mock';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const STORAGE_KEY = 'altoquecv_postulaciones';

export function usePostulaciones() {
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = loadFromStorage<Postulacion[]>(STORAGE_KEY);
    if (saved && saved.length > 0) {
      setPostulaciones(saved);
    } else {
      const mocked = postulacionesMockFactory();
      setPostulaciones(mocked);
      saveToStorage(STORAGE_KEY, mocked);
    }
    setIsLoading(false);
  }, []);

  const movePostulacion = (id: string, nuevoStatus: PostulacionStatus) => {
    setPostulaciones((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, status: nuevoStatus } : p
      );
      saveToStorage(STORAGE_KEY, updated);
      return updated;
    });
  };

  const deletePostulacion = (id: string) => {
    setPostulaciones((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveToStorage(STORAGE_KEY, updated);
      return updated;
    });
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