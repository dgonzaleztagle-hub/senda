export enum SchoolContactStatus {
  Contacted = 'Contactado',
  NotContacted = 'No Contactado',
}

export enum CourseVisitStatus {
  Scheduled = 'Agendado',
  NotScheduled = 'No Agendado',
  Rejected = 'Rechazado',
}

export enum AppointmentType {
  SchoolVisit = 'Visita a Colegio',
  SchoolCall = 'Llamada a Colegio',
  CourseVisit = 'Visita a Curso',
}

export enum SchoolManagementStatus {
  Pending = 'Gestión Pendiente',
  Completed = 'Gestión Terminada',
}

export interface Appointment {
  id: string;
  schoolId: number;
  courseId?: string; 
  type: AppointmentType;
  dateTime: Date;
  notes?: string;
}

export interface Course {
  id: string;
  level: string;
  letter: string;
}

export interface Note {
  id: string;
  content: string;
  timestamp: Date;
}

export interface School {
  code: number;
  name: string;
  phone: string;
  email: string;
  director: string;
  latitude: number;
  longitude: number;
  courses: Course[];
  notes: Note[];
  managementStatus: SchoolManagementStatus;
}

// Raw data structure from Gemini API
export interface RawSchoolData {
  codigo: number;
  'NOMBRE COLEGIO': string;
  CURSO: string;
  LETRA: string;
  TELEFONO: string;
  CORREO: string;
  'NOMBRES DIRECTOR': string;
  'APELLIDO DIRECTOR': string;
  latitud: number;
  longitud: number;
}