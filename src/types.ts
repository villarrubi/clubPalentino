export type Role = "student" | "teacher" | "admin";
export type Course = "iniciacion" | "avanzado";
export type MaterialSection = "syllabus" | "exercises" | "resources";
export const sectionNames: Record<MaterialSection, string> = {
  syllabus: "Temario",
  exercises: "Ejercicios",
  resources: "Recursos",
};
export interface Credentials {
  email?: string;
  password: string;
}
export interface Session {
  role: Role;
  name: string;
}
export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: "teacher" | "admin";
  active: boolean;
  isCurrent: boolean;
}
export interface NewStaffUser {
  email: string;
  name: string;
  role: "teacher" | "admin";
  password: string;
  currentPassword: string;
}
export type StaffUserChanges = Partial<Pick<StaffUser, "name" | "role" | "active">> & {
  password?: string;
  currentPassword: string;
};
export interface ClassPasswordChange {
  password: string;
  currentPassword: string;
}
export interface Material {
  id: string;
  title: string;
  topic: string;
  course: Course;
  section: MaterialSection;
  block: string;
  filename: string;
  size: number;
  updatedAt: string;
}
export interface MaterialInput {
  title: string;
  topic: string;
  course: Course;
  section: MaterialSection;
  block: string;
}
export interface Tournament {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  url: string;
}
export type TournamentInput = Omit<Tournament, "id">;
export interface NewsInput {
  title: string;
  date: string;
  summary: string;
  content: string;
  imageAlt: string;
  source: string;
  url: string;
}
export interface NewsArticle extends NewsInput {
  id: string;
  imageUrl: string;
  updatedAt: string;
}
export interface Repository {
  mode: "demo" | "remote";
  session(): Promise<Session | null>;
  login(credentials: Credentials): Promise<Session>;
  logout(): Promise<void>;
  users(): Promise<StaffUser[]>;
  createUser(input: NewStaffUser): Promise<void>;
  updateUser(id: string, input: StaffUserChanges): Promise<void>;
  updateClassPassword(input: ClassPasswordChange): Promise<void>;
  materials(): Promise<Material[]>;
  saveMaterial(input: MaterialInput, file?: File, id?: string): Promise<void>;
  deleteMaterial(id: string): Promise<void>;
  download(id: string): Promise<Blob>;
  tournaments(): Promise<Tournament[]>;
  saveTournament(input: TournamentInput, id?: string): Promise<void>;
  deleteTournament(id: string): Promise<void>;
  news(): Promise<NewsArticle[]>;
  saveNews(input: NewsInput, image?: File, id?: string): Promise<void>;
  deleteNews(id: string): Promise<void>;
}
export const courseNames: Record<Course, string> = {
  iniciacion: "Iniciación",
  avanzado: "Avanzado",
};
export const roleNames: Record<Role, string> = {
  student: "Alumno",
  teacher: "Profesor",
  admin: "Administrador",
};
