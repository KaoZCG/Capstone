export interface OfertaDetectada {
  titulo: string;
  empresa: string;
  ubicacion: string;
  portal: 'trabajando' | 'laborum' | 'linkedin' | 'chile-trabajos' | 'computrabajo';
  url: string;
  descripcion?: string;
}

export interface CompatibilidadWidget {
  scoreGeneral: number; 
  desglose: {
    skillsTecnicos: number; 
    pretensionSalarial: number; 
    nivelExperiencia: number; 
    formacionAcademica?: number;
  };
  mensaje?: string;
  mapeoCampos: {
    total: number;
    completados: number;
  };
  datosDetectados: {
    rut: { valor: string; validado: boolean };
    telefono: { valor: string; validado: boolean };
    rentaPretendida: { valor: number; optimizada: boolean };
  };
}

export interface WidgetProfileData {
  rut?: string | null;
  phone?: string | null;
  salary_min?: number | null;
  skills?: string[];
  experience?: { role?: string; stackTags?: string[] }[];
  education?: { degree?: string; tags?: string[] }[];
}
