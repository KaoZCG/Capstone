import { useState, useCallback, useEffect } from 'react';
import { SyncConsoleState, SyncLogEntry, PortalName } from '@/types';
import { generateInitialLogs } from '@/lib/mock/sync-console.mock';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const CONSOLE_STORAGE_KEY = 'altoquecv_sync_console';

export function useSyncConsole() {
  const [state, setState] = useState<SyncConsoleState>({
    logs: [],
    sincronizandoAhora: false,
  });

  useEffect(() => {
    const saved = loadFromStorage<SyncConsoleState>(CONSOLE_STORAGE_KEY);
    if (saved) {
      setState(saved);
    } else {
      const initial = {
        logs: generateInitialLogs(),
        sincronizandoAhora: false,
        ultimaSincronizacion: new Date(Date.now() - 600000).toISOString(),
      };
      setState(initial);
      saveToStorage(CONSOLE_STORAGE_KEY, initial);
    }
  }, []);

  const addLog = useCallback((log: SyncLogEntry) => {
    setState((prev) => {
      const updated = {
        ...prev,
        logs: [log, ...prev.logs].slice(0, 100),
      };
      saveToStorage(CONSOLE_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const sincronizarAhora = useCallback(async (portal: PortalName) => {
    setState((prev) => ({ ...prev, sincronizandoAhora: true }));

    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tipo: 'info',
      portal,
      mensaje: `Iniciando escaneo en ${portal}...`,
    });

    // Simula el tiempo de la API / Web Scraping
    setTimeout(() => {
      addLog({
        id: `log-${Date.now() + 1}`,
        timestamp: new Date().toISOString(),
        tipo: 'success',
        portal,
        mensaje: 'Sincronización completada con éxito',
        detalles: `Se revisaron las últimas 24 hrs. 2 ofertas añadidas al embudo.`,
      });

      setState((prev) => ({
        ...prev,
        sincronizandoAhora: false,
        ultimaSincronizacion: new Date().toISOString(),
      }));
    }, 2500);
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setState((prev) => {
      const updated = { ...prev, logs: [] };
      saveToStorage(CONSOLE_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  return { state, addLog, sincronizarAhora, clearLogs };
}