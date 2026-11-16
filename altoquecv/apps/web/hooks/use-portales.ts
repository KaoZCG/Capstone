'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PortalIntegracion, PortalName } from '@/types';
import { portalesMock } from '@/lib/mock/portales.mock';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const PORTALS_STORAGE_KEY = 'altoquecv_portales_v1';

function mergeSavedPortals(saved: unknown): PortalIntegracion[] {
  if (!Array.isArray(saved)) return portalesMock;

  return portalesMock.map((portal) => {
    const stored = saved.find(
      (item): item is Partial<PortalIntegracion> & { id: PortalName } =>
        Boolean(item)
        && typeof item === 'object'
        && item.id === portal.id,
    );
    if (!stored) return portal;

    return {
      ...portal,
      conectado: stored.conectado === true,
      ultimaSincronizacion: typeof stored.ultimaSincronizacion === 'string'
        ? stored.ultimaSincronizacion
        : undefined,
      estadoSync: stored.estadoSync === 'sincronizado' ? 'sincronizado' : 'inactivo',
    };
  });
}

export function usePortales() {
  const [portales, setPortales] = useState<PortalIntegracion[]>(portalesMock);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setPortales(mergeSavedPortals(loadFromStorage<unknown>(PORTALS_STORAGE_KEY)));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) saveToStorage(PORTALS_STORAGE_KEY, portales);
  }, [isHydrated, portales]);

  const toggleConnection = useCallback((id: PortalName) => {
    setPortales((current) => current.map((portal) =>
      portal.id === id
        ? { ...portal, conectado: !portal.conectado, estadoSync: 'inactivo' }
        : portal,
    ));
  }, []);

  return { portales, toggleConnection };
}
