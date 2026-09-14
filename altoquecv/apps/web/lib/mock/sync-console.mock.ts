import { SyncLogEntry, PortalName } from '@/types';

export function generateInitialLogs(): SyncLogEntry[] {
  return [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      tipo: 'success',
      portal: 'laborum',
      mensaje: 'Sincronización completada',
      detalles: '12 nuevas ofertas evaluadas (3 superan umbral).',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 480000).toISOString(),
      tipo: 'success',
      portal: 'trabajando',
      mensaje: 'Sincronización completada',
      detalles: '8 nuevas ofertas encontradas.',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      tipo: 'warning',
      portal: 'linkedin',
      mensaje: 'Portal no conectado. Se omitió la sincronización.',
    },
  ];
}

export function generateSyncLog(portal: string): SyncLogEntry {
  return {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    tipo: 'info',
    portal: portal as PortalName,
    mensaje: `Sincronizando portal ${portal}...`,
  };
}