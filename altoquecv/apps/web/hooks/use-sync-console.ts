import { useState, useCallback, useEffect } from 'react';
import { SyncConsoleState, SyncLogEntry, PortalName } from '@/types';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const CONSOLE_STORAGE_KEY = 'altoquecv_sync_console_v2';

export function useSyncConsole() {
  const [state, setState] = useState<SyncConsoleState>({
    logs: [],
    sincronizandoAhora: false,
  });

  useEffect(() => {
    const saved = loadFromStorage<SyncConsoleState>(CONSOLE_STORAGE_KEY);
    if (saved) {
      const filtered = {
        ...saved,
        sincronizandoAhora: false,
        logs: saved.logs.filter((log) => !/demostraci[oó]n|no se consultaron ni guardaron/i.test(
          `${log.mensaje} ${log.detalles ?? ''}`,
        )),
      };
      setState(filtered);
      saveToStorage(CONSOLE_STORAGE_KEY, filtered);
    } else {
      const initial = {
        logs: [],
        sincronizandoAhora: false,
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

  const sincronizarAhora = useCallback((portal: PortalName): Promise<void> => {
    return Promise.reject(
      new Error(`La sincronización automática de ${portal} aún no está disponible.`),
    );
  }, []);

  const clearLogs = useCallback(() => {
    setState((prev) => {
      const updated = { ...prev, logs: [] };
      saveToStorage(CONSOLE_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  return { state, addLog, sincronizarAhora, clearLogs };
}
