import { Postulacion } from '@/types';

export function postulacionesMockFactory(): Postulacion[] {
  return [
    {
      id: 'post-001',
      empresa: { id: 'emp-001', nombre: 'Mercado Libre' },
      cargo: 'Desarrollador Backend Python/FastAPI',
      ubicacion: 'Santiago, RM',
      compatibilidad: 96,
      status: 'cv-en-revision',
      fechaPostulacion: new Date('2026-09-08T10:00:00Z').toISOString(),
      competenciasCubiertas: ['Python', 'FastAPI', 'Microservicios', 'SQL'],
      proximoPaso: 'Esperar filtro automático',
    },
    {
      id: 'post-002',
      empresa: { id: 'emp-002', nombre: 'Falabella Financiero' },
      cargo: 'Especialista RPA & Automatización',
      ubicacion: 'Híbrido - RM',
      compatibilidad: 92,
      status: 'entrevista-agendada',
      fechaPostulacion: new Date('2026-08-25T14:30:00Z').toISOString(),
      competenciasCubiertas: ['RPA', 'Python', 'Optimización de Procesos'],
      proximoPaso: 'Entrevista técnica (Jueves 15:00)',
    },
    {
      id: 'post-003',
      empresa: { id: 'emp-003', nombre: 'Buda.com' },
      cargo: 'Data Engineer (BigQuery)',
      ubicacion: 'Remoto',
      compatibilidad: 88,
      status: 'postulada',
      fechaPostulacion: new Date('2026-09-10T09:15:00Z').toISOString(),
      competenciasCubiertas: ['BigQuery', 'PostgreSQL', 'ETL'],
    },
    {
      id: 'post-004',
      empresa: { id: 'emp-004', nombre: 'Cencosud' },
      cargo: 'Tech Lead Backend',
      ubicacion: 'Las Condes, RM',
      compatibilidad: 75,
      status: 'oferta-negociacion',
      fechaPostulacion: new Date('2026-08-15T11:20:00Z').toISOString(),
      competenciasCubiertas: ['Liderazgo', 'Arquitectura Cloud', 'Python'],
      proximoPaso: 'Revisar propuesta salarial',
    }
  ];
}