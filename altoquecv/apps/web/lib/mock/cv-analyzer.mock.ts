import { CV, ATSAnalysis, CompatibilidadComparativa } from '@/types';

export const cvMock: CV = {
  id: 'cv-001',
  nombre: 'Rodrigo Andrés Sepúlveda',
  email: 'r.sepulveda@email.com',
  teléfono: '+56975831234',
  resumen: 'Tech Lead con 7+ años en arquitectura de software y liderazgo de equipos. Especialista en React, TypeScript y diseño de sistemas escalables para el sector financiero.',
  experiencias: [
    {
      empresa: 'Fintechmail',
      cargo: 'Tech Lead',
      fechaInicio: '2022-03-01',
      descripcion: 'Lideré equipo de 5 desarrolladores en la migración de una arquitectura monolítica a microservicios. Aumenté el rendimiento del sistema central en un 40%.',
      habilidades: ['React', 'TypeScript', 'Node.js', 'Leadership'],
    },
    {
      empresa: 'BCI Labs',
      cargo: 'Senior Frontend Engineer',
      fechaInicio: '2020-06-01',
      fechaFin: '2022-02-28',
      descripcion: 'Desarrollé la arquitectura frontend de una plataforma de inversiones utilizada por más de 50.000 usuarios activos mensuales.',
      habilidades: ['React', 'Redux', 'D3.js', 'CSS-in-JS'],
    },
  ],
  educación: [
    {
      institución: 'Universidad de Chile',
      grado: 'Ingeniero Civil Informático',
      año: 2018,
      especialización: 'Ingeniería de Software',
    },
  ],
  habilidades: [
    { nombre: 'React', nivel: 'senior', categoría: 'técnica' },
    { nombre: 'TypeScript', nivel: 'senior', categoría: 'técnica' },
    { nombre: 'Node.js', nivel: 'mid', categoría: 'técnica' },
    { nombre: 'Leadership', nivel: 'mid', categoría: 'blanda' },
    { nombre: 'Figma', nivel: 'junior', categoría: 'herramienta' },
  ],
};

export function generateATSAnalysisMock(cv: CV): ATSAnalysis {
  return {
    score: 87,
    keywords: {
      encontradas: ['React', 'TypeScript', 'Node.js', 'Leadership', 'Microservicios'],
      faltantes: ['Docker', 'Kubernetes', 'AWS', 'GraphQL'],
      recomendadas: ['PostgreSQL', 'Redis', 'CI/CD', 'Testing'],
    },
    desglose: {
      habilidades: 92,
      experiencia: 85,
      educación: 80,
      formato: 78,
    },
    sugerencias: [
      {
        id: 'sug-001',
        tipo: 'crítica',
        título: 'Falta experiencia en Cloud (AWS/GCP)',
        descripción: 'Las ofertas de Tech Lead en el mercado actual exigen AWS en un 78% de los casos.',
        acción: 'Incluir certificaciones o proyectos demostrables en Cloud',
        impacto: 8,
      },
      {
        id: 'sug-002',
        tipo: 'importante',
        título: 'Cuantificar logros antiguos',
        descripción: 'Tu experiencia en BCI Labs es fuerte, pero carece de métricas de impacto comercial.',
        acción: 'Añadir porcentajes de mejora o ingresos generados',
        impacto: 5,
      },
      {
        id: 'sug-003',
        tipo: 'mejora',
        título: 'Sección de herramientas de diseño',
        descripción: 'Mencionar Figma como Junior en un perfil Tech Lead puede diluir tu foco técnico.',
        acción: 'Considerar moverlo a "Conocimientos Adicionales" o removerlo',
        impacto: 2,
      },
    ],
    fortalezas: [
      'Experiencia sólida en stack moderno (React, TypeScript)',
      'Trayectoria de liderazgo técnico claramente progresiva',
      'Educación formal alineada al rol',
    ],
  };
}

export function generateComparativaATSMock(): CompatibilidadComparativa {
  return {
    cvActual: 87,
    promedioPortal: 72,
    rango: { min: 45, max: 98 },
    percentil: 85,
  };
}