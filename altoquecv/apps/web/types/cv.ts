export interface CVSkill {
  nombre: string;
  nivel: 'junior' | 'mid' | 'senior';
  categoría: 'técnica' | 'blanda' | 'herramienta';
}

export interface CVExperiencia {
  empresa: string;
  cargo: string;
  fechaInicio: string; 
  fechaFin?: string;
  descripcion: string;
  habilidades: string[];
}

export interface CVEducacion {
  institución: string;
  grado: string;
  año: number;
  especialización?: string;
}

export interface CV {
  id: string;
  nombre: string;
  email: string;
  teléfono: string;
  resumen?: string;
  experiencias: CVExperiencia[];
  educación: CVEducacion[];
  habilidades: CVSkill[];
  idiomas?: string[];
  certificaciones?: string[];
}

export interface ATSAnalysis {
  score: number;
  keywords: {
    encontradas: string[];
    faltantes: string[];
    recomendadas: string[];
  };
  desglose: {
    habilidades: number;
    experiencia: number;
    educación: number;
    formato: number;
  };
  sugerencias: Sugerencia[];
  fortalezas: string[];
}

export interface Sugerencia {
  id: string;
  tipo: 'crítica' | 'importante' | 'mejora';
  título: string;
  descripción: string;
  acción?: string;
  impacto: number;
}

export interface CompatibilidadComparativa {
  cvActual: number;
  promedioPortal: number;
  rango: {
    min: number;
    max: number;
  };
  percentil: number;
}