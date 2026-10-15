export interface PersonalData {
  fullName: string;
  rut: string;
  isRutVerified: boolean;
  email: string;
  isEmailVerified: boolean;
  phoneCode: string;
  phone: string;
  region: string;
  comuna: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string | "Presente";
  tags: string[];
  location?: string;
  studyMode?: string;
  description?: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string | "Presente";
  isCurrent: boolean;
  description: string;
  stackTags: string[];
  location?: string;
  employmentType?: string;
}

export interface IAPreference {
  id: string;
  model: string;
  description: string;
}

export interface UserProfile {
  personalData: PersonalData;
  education: Education[];
  experience: Experience[];
  skills: string[];                       
  salaryExpectations?: {                   
    min: number;
    max: number;
    currency: string;
  };
  iaPreferences: IAPreference[];
}