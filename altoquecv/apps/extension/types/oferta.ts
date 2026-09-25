export interface OfertaDetectada {
  titulo: string;
  empresa: string;
  ubicacion: string;
  portal: 'trabajando' | 'laborum' | 'linkedin' | 'chile-trabajos' | 'computrabajo';
  url: string;
}

export interface CompatibilidadWidget {
  scoreGeneral: number; 
  desglose: {
    skillsTecnicos: number; 
    pretensionSalarial: number; 
    nivelExperiencia: number; 
  };
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