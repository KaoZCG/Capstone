import { UserProfile } from "@/types/perfil";

export const mockProfile: UserProfile = {
  personalData: {
    fullName: "Rodrigo Sanhueza",
    rut: "18.456.789-K",
    isRutVerified: true,
    email: "rodrigo.sanhueza@gmail.com",
    isEmailVerified: true,
    phoneCode: "+56",
    phone: "9 8765 4321",
    region: "Región Metropolitana",
    comuna: "Providencia",
  },
  education: [
    {
      id: "edu-1",
      institution: "Universidad de Chile",
      degree: "Ingeniería Civil Informática",
      startDate: "Marzo 2015",
      endDate: "Diciembre 2020",
      tags: ["Desarrollo de Software", "Sistemas Distribuidos"],
    },
  ],
  experience: [
    {
      id: "exp-1",
      role: "Senior Full-Stack Developer",
      company: "TechSolutions Latam",
      startDate: "Enero 2023",
      endDate: "Presente",
      isCurrent: true,
      description: "Liderazgo técnico en la migración de arquitectura monolítica a microservicios. Implementación de CI/CD reduciendo el tiempo de despliegue en un 40%.",
      stackTags: ["React", "Next.js", "Node.js", "AWS"],
    },
    {
      id: "exp-2",
      role: "Desarrollador Front-End",
      company: "StartupChile Finanzas",
      startDate: "Marzo 2021",
      endDate: "Diciembre 2022",
      isCurrent: false,
      description: "Desarrollo de plataforma web transaccional para clientes B2B. Optimización de performance logrando un score de 95+ en Lighthouse.",
      stackTags: ["Vue.js", "TypeScript", "Tailwind CSS"],
    },
  ],
  skills: [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "AWS",
    "PostgreSQL",
    "Docker",
    "CI/CD",
    "Tailwind CSS",
    "REST APIs",
    "GraphQL",
    "Git",
  ],
  salaryExpectations: {
    min: 3500000,
    max: 5500000,
    currency: "CLP",
  },
  iaPreferences: [
    {
      id: "gpt-4-turbo",
      model: "GPT-4 Turbo",
      description: "Mayor precisión lógica y capacidad de análisis complejo.",
    },
    {
      id: "claude-3-opus",
      model: "Claude 3 Opus",
      description: "Redacción más natural, empática y estructurada.",
    },
  ],
};
