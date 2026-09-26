export type Role = "student" | "teacher" | "admin";
export type Course = "iniciacion" | "avanzado";
export interface Session {
  role: Role;
  name: string;
}
export interface Material {
  id: string;
  title: string;
  topic: string;
  course: Course;
  filename: string;
  size: number;
  updatedAt: string;
}
export interface MaterialInput {
  title: string;
  topic: string;
  course: Course;
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
export interface Repository {
  mode: "demo" | "remote";
  session(): Promise<Session | null>;
  login(role: Role, password: string, email?: string): Promise<Session>;
  logout(): Promise<void>;
  materials(): Promise<Material[]>;
  saveMaterial(input: MaterialInput, file?: File, id?: string): Promise<void>;
  deleteMaterial(id: string): Promise<void>;
  download(id: string): Promise<Blob>;
  tournaments(): Promise<Tournament[]>;
  saveTournament(input: TournamentInput, id?: string): Promise<void>;
  deleteTournament(id: string): Promise<void>;
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
