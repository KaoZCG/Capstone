import { PortalIntegracion, AutocompleteConfig } from '@/types';

export const portalesMock: PortalIntegracion[] = [
  {
    id: 'laborum',
    nombre: 'Laborum',
    conectado: false,
    estadoSync: 'inactivo',
  },
  {
    id: 'trabajando',
    nombre: 'Trabajando.com',
    conectado: false,
    estadoSync: 'inactivo',
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
    minCompatibilidad: 0,
    soloEnRM: false,
    soloTiempoCompleto: false,
    comunas: [],
  },
  autoSyncActivo: false,
  intervaloSync: 0,
};