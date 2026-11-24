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
  tipo?: 'laborum' | 'trabajando';
  url_oferta?: string;
  preguntas_respuestas?: { pregunta: string; respuesta: string }[];
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
