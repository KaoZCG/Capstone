export type PortalName =
  | 'laborum'
  | 'trabajando'
  | 'linkedin'
  | 'chile-trabajos'
  | 'computrabajo';

export interface PortalIntegracion {
  id: PortalName;
  nombre: string;
  logo?: string;
  conectado: boolean;
  ultimaSincronizacion?: string;
  estadoSync: 'inactivo' | 'sincronizando' | 'sincronizado' | 'error';
  errorMensaje?: string;
}

export interface AutocompleteRule {
  id: string;
  nombreCampo: string;
  habilitado: boolean;
  valor?: string | string[];
}

export interface AutocompleteConfig {
  rules: AutocompleteRule[];
  filtros: {
    minCompatibilidad: number;
    soloEnRM: boolean;
    soloTiempoCompleto: boolean;
    rangoSalarialMin?: number;
    rangoSalarialMax?: number;
    comunas: string[];
  };
  autoSyncActivo: boolean;
  intervaloSync: number;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  portal: PortalName;
  mensaje: string;
  detalles?: string;
}

export interface SyncConsoleState {
  logs: SyncLogEntry[];
  sincronizandoAhora: boolean;
  ultimaSincronizacion?: string;
}