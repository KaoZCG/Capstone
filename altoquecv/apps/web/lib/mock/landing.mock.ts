export interface Testimonial {
  id: string;
  nombre: string;
  rol: string;
  empresa: string;
  avatar: string;
  quote: string;
  rating: number;
  resultado?: string;
}

export interface ComparadorRow {
  metrica: string;
  promedio: number | string;
  conAltoqueCV: number | string;
  mejora: string;
}

export const testimonialesMock: Testimonial[] = [
  {
    id: "test-1",
    nombre: "Gonzalo Morales",
    rol: "Analista Senior de Riesgo",
    empresa: "Banco de Chile",
    avatar: "https://i.pravatar.cc/150?u=gonzalo",
    quote: "Llevaba 4 meses enviando CVs a la banca sin ninguna llamada. Con AltoqueCV pasé de 0 entrevistas a 3 procesos paralelos en menos de dos semanas.",
    rating: 5,
  },
  {
    id: "test-2",
    nombre: "Valentina Ríos",
    rol: "Product Designer",
    empresa: "Falabella.com",
    avatar: "https://i.pravatar.cc/150?u=valentina",
    quote: "El autollenado en Trabajando.com me devolvió horas de vida. Ya no tengo que copiar y pegar las mismas respuestas de pretensión y experiencia.",
    rating: 5,
  },
  {
    id: "test-3",
    nombre: "Matías Sepúlveda",
    rol: "Full Stack Developer",
    empresa: "NotCo",
    avatar: "https://i.pravatar.cc/150?u=matias",
    quote: "El scoring ATS me indicó exactamente cuáles librerías y metodologías no estaban explicitadas en mi perfil. Quedé seleccionado en mi primer intento.",
    rating: 5,
  },
  {
    id: "test-4",
    nombre: "Carolina Edwards",
    rol: "Growth Manager",
    empresa: "Cornershop",
    avatar: "https://i.pravatar.cc/150?u=carolina",
    quote: "Postular a más de 30 empresas de forma personalizada era imposible antes. AltoqueCV me permitió ser selectiva y estratégica.",
    rating: 5,
  },
];

export const comparadorATSMock: ComparadorRow[] = [
  { metrica: "Compatibilidad ATS promedio", promedio: "64%", conAltoqueCV: "87%", mejora: "+36%" },
  { metrica: "Tiempo por postulación", promedio: "25 min", conAltoqueCV: "2 min", mejora: "-92%" },
  { metrica: "Postulaciones enviadas / mes", promedio: 6, conAltoqueCV: 18, mejora: "+200%" },
  { metrica: "Tasa de respuesta inicial", promedio: "22%", conAltoqueCV: "54%", mejora: "+145%" },
];