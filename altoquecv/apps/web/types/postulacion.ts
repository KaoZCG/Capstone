export type PostulacionStatus = 
  | 'postulada' 
  | 'cv-en-revision' 
  | 'entrevista-agendada' 
  | 'oferta-negociacion';

export interface Empresa {
  id: string;
  nombre: string;
  logo?: string;
}

export interface Postulacion {
  id: string;
  empresa: Empresa;
  cargo: string;
  ubicacion: string;
  compatibilidad: number;
  status: PostulacionStatus;
  fechaPostulacion: string;
  descripcionOferta?: string;
  competenciasCubiertas?: string[];
  proximoPaso?: string;
}

export interface DashboardStats {
  totalPostulaciones: number;
  cvEnRevision: number;
  entrevistasAgendadas: number;
  compatibilidadPromedio: number;
}