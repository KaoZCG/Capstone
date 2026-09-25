import type { OfertaDetectada, CompatibilidadWidget } from '../../types/oferta';

export const ofertaDetectadaMock: OfertaDetectada = {
  titulo: 'Líder Técnico Frontend',
  empresa: 'Retail Tech Confidencial',
  ubicacion: 'Santiago, Las Condes · Híbrido',
  portal: 'trabajando',
  url: typeof window !== 'undefined' ? window.location.href : '',
};

export const compatibilidadMock: CompatibilidadWidget = {
  scoreGeneral: 94,
  desglose: {
    skillsTecnicos: 100,
    pretensionSalarial: 100,
    nivelExperiencia: 80, 
  },
  mapeoCampos: {
    total: 4,
    completados: 4,
  },
  datosDetectados: {
    rut: { valor: '14.165.123-0', validado: true },
    telefono: { valor: '+56 9 8765 4321', validado: true },
    rentaPretendida: { valor: 3200000, optimizada: true },
  },
};

export function generateMockAnalysis(): CompatibilidadWidget {
  const variacion = Math.floor(Math.random() * 10) - 5; 
  return {
    ...compatibilidadMock,
    scoreGeneral: Math.max(60, Math.min(99, compatibilidadMock.scoreGeneral + variacion)),
  };
}