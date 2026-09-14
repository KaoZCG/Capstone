import { PortalIntegracion, AutocompleteConfig } from '@/types';

export const portalesMock: PortalIntegracion[] = [
  {
    id: 'laborum',
    nombre: 'Laborum',
    conectado: true,
    ultimaSincronizacion: new Date(Date.now() - 3600000).toISOString(),
    estadoSync: 'sincronizado',
  },
  {
    id: 'trabajando',
    nombre: 'Trabajando.com',
    conectado: true,
    ultimaSincronizacion: new Date(Date.now() - 7200000).toISOString(),
    estadoSync: 'sincronizado',
  },
  {
    id: 'linkedin',
    nombre: 'LinkedIn Jobs',
    conectado: false,
    estadoSync: 'inactivo',
  },
  {
    id: 'chile-trabajos',
    nombre: 'ChileTrabajos',
    conectado: true,
    ultimaSincronizacion: new Date(Date.now() - 1800000).toISOString(),
    estadoSync: 'sincronizado',
  },
  {
    id: 'computrabajo',
    nombre: 'ComputrabajoChile',
    conectado: false,
    estadoSync: 'inactivo',
  },
];

export const autocompleteMockConfig: AutocompleteConfig = {
  rules: [
    { id: 'rule-1', nombreCampo: 'Nombre completo', habilitado: true },
    { id: 'rule-2', nombreCampo: 'Correo electrónico', habilitado: true },
    { id: 'rule-3', nombreCampo: 'Teléfono', habilitado: true },
    { id: 'rule-4', nombreCampo: 'Experiencia laboral', habilitado: true },
    { id: 'rule-5', nombreCampo: 'Educación y Certificados', habilitado: false },
    { id: 'rule-6', nombreCampo: 'Pretensiones de renta', habilitado: true },
  ],
  filtros: {
    minCompatibilidad: 75,
    soloEnRM: true,
    soloTiempoCompleto: false,
    rangoSalarialMin: 1500000,
    rangoSalarialMax: 3500000,
    comunas: ['Providencia', 'Las Condes', 'Santiago Centro'],
  },
  autoSyncActivo: true,
  intervaloSync: 30,
};