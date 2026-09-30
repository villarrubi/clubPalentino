import type {
  Repository,
  StaffUser,
  NewStaffUser,
  StaffUserChanges,
  NewsArticle,
  NewsInput,
  Session,
  Credentials,
  Material,
  MaterialInput,
  Tournament,
  TournamentInput,
} from "./types";
import { news as pressNews } from "./data";
import { readNewsImage, validateNews } from "./newsValidation";
import { publicImage, publicLink, sessionExpiredEvent } from "./security";

export const acceptedExtensions = [
  "pdf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "odt",
  "odp",
  "pgn",
  "zip",
  "txt",
];
export const acceptFiles = acceptedExtensions.map((ext) => `.${ext}`).join(",");
export function validateFile(file: File) {
  if (
    !acceptedExtensions.includes(
      file.name.split(".").pop()?.toLowerCase() ?? "",
    )
  )
    throw new Error(
      "Formato no admitido. Utiliza PDF, PowerPoint, Word, OpenDocument, PGN, ZIP o TXT.",
    );
  if (!file.size)
    throw new Error(
      "El archivo está vacío. Selecciona un archivo con contenido.",
    );
  if (file.size > 25 * 1024 * 1024)
    throw new Error(
      "El archivo supera los 25 MB. Reduce su tamaño antes de subirlo.",
    );
}
export function validateMaterial(input: MaterialInput) {
  if (!input.title.trim() || !input.topic.trim())
    throw new Error("Indica un título y un tema.");
  if (!["iniciacion", "avanzado"].includes(input.course))
    throw new Error("Selecciona un nivel válido.");
  if (!["syllabus", "exercises", "resources"].includes(input.section))
    throw new Error("Selecciona una sección válida.");
  if (input.section === "exercises" && !input.block.trim())
    throw new Error("Indica un bloque para los ejercicios.");
  if (input.block.length > 80)
    throw new Error("El bloque no puede superar los 80 caracteres.");
  if (input.title.length > 160 || input.topic.length > 80)
    throw new Error("El título o el tema es demasiado largo.");
}
export function validateTournament(input: TournamentInput) {
  if (
    !input.title.trim() ||
    !input.location.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    Number.isNaN(Date.parse(`${input.date}T12:00:00`))
  )
    throw new Error("Completa el título, una fecha válida y el lugar.");
  if (input.url) {
    let url: URL;
    try {
      url = new URL(input.url);
    } catch {
      throw new Error("Introduce un enlace completo que empiece por https://.");
    }
    if (url.protocol !== "https:")
      throw new Error("El enlace debe empezar por https://.");
  }
}

let database: Promise<IDBDatabase> | undefined;
function db() {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("palentino-demo-v1", 2);
    let blocked = false;
    request.onblocked = () => {
      blocked = true;
      reject(
        new Error(
          "Cierra las otras pestañas del club y recarga para actualizar el almacenamiento local.",
        ),
      );
    };
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("materials")) {
        database.createObjectStore("materials", { keyPath: "id" });
        database.createObjectStore("files");
        database.createObjectStore("tournaments", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("news")) {
        const store = database.createObjectStore("news", { keyPath: "id" });
        store.put({
          id: "memorial-alberto-acero",
          title: pressNews.title,
          date: pressNews.date,
          summary: pressNews.description,
          content: pressNews.description,
          imageUrl: "",
          imageAlt: "",
          source: pressNews.source,
          url: pressNews.url,
          updatedAt: `${pressNews.date}T12:00:00.000Z`,
        } satisfies NewsArticle);
      }
    };
    request.onsuccess = () => {
      if (blocked) {
        request.result.close();
        database = undefined;
        return;
      }
      request.result.onversionchange = () => {
        request.result.close();
        database = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () =>
      reject(
        new Error(
          "No se pudo abrir el almacenamiento local. Comprueba los permisos de tu navegador.",
        ),
      );
  });
  return database;
}
async function read<T>(store: string, id?: string): Promise<T> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readonly");
    const request = id
      ? tx.objectStore(store).get(id)
      : tx.objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("No se pudieron leer los datos guardados."));
  });
}
// Old local materials remain available as syllabus; no stored role is trusted.
function normalizeMaterial(material: Material): Material {
  return {
    ...material,
    section: material.section ?? "syllabus",
    block: material.block ?? "",
  };
}
function validatedSession(value: Session | null): Session | null {
  if (value === null) return null;
  if (
    !value ||
    !["student", "teacher", "admin"].includes(value.role) ||
    typeof value.name !== "string"
  )
    throw new Error("El servicio ha devuelto una sesión no válida.");
  return { role: value.role, name: value.name };
}
class DemoRepository implements Repository {
  readonly mode = "demo" as const;
  async session(): Promise<Session | null> {
    sessionStorage.removeItem("palentino-session");
    sessionStorage.removeItem("palentino-student-preview");
    return null;
  }
  async login(_credentials: Credentials): Promise<Session> {
    throw new Error("El acceso aún no está configurado. Contacta con el club.");
  }
  async logout() {
    sessionStorage.removeItem("palentino-session");
    sessionStorage.removeItem("palentino-student-preview");
  }
  private denyAccess(): never {
    throw new Error("No tienes permiso para acceder al contenido. El servicio de acceso aún no está configurado.");
  }
  async materials(): Promise<Material[]> { return this.denyAccess(); }
  async users(): Promise<StaffUser[]> { return this.denyAccess(); }
  async createUser(_input: NewStaffUser) { this.denyAccess(); }
  async updateUser(_id: string, _input: StaffUserChanges) { this.denyAccess(); }
  async saveMaterial(_input: MaterialInput, _file?: File, _id?: string) { this.denyAccess(); }
  async deleteMaterial(_id: string) { this.denyAccess(); }
  async download(_id: string): Promise<Blob> { return this.denyAccess(); }
  async tournaments() { return (await read<Tournament[]>("tournaments")).map(safeTournament); }
  async saveTournament(_input: TournamentInput, _id?: string) { this.denyAccess(); }
  async deleteTournament(_id: string) { this.denyAccess(); }
  async news() { return (await read<NewsArticle[]>("news")).map(safeNews); }
  async saveNews(_input: NewsInput, _image?: File, _id?: string) { this.denyAccess(); }
  async deleteNews(_id: string) { this.denyAccess(); }
}

const safeTournament = (item: Tournament): Tournament => ({ ...item, url: publicLink(item.url) });
const safeNews = (item: NewsArticle): NewsArticle => ({ ...item, url: publicLink(item.url), imageUrl: publicImage(item.imageUrl) });

class RemoteRepository implements Repository {
  readonly mode = "remote" as const;
  constructor(private base: string) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.base}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      redirect: "error",
      headers: { "X-Requested-With": "ClubPalentino", ...init?.headers },
    });
    if (!response.ok) {
      if (response.status === 401) {
        if (path !== "/session" || init?.method !== "POST") window.dispatchEvent(new Event(sessionExpiredEvent));
        throw new Error(
          "La sesión ha caducado o las credenciales no son correctas. Vuelve a acceder.",
        );
      }
      if (path.startsWith('/users') && [400, 403, 409].includes(response.status)) {
        const body = await response.json().catch(() => null);
        if (typeof body?.error === 'string') throw new Error(body.error);
      }
      if (response.status === 403)
        throw new Error("Tu perfil no tiene permiso para esta acción.");
      if (response.status === 429)
        throw new Error("Demasiados intentos. Espera unos minutos antes de volver a intentarlo.");
      throw new Error(
        "El servicio no ha podido completar la operación. Inténtalo de nuevo.",
      );
    }
    return response.status === 204 ? (undefined as T) : response.json();
  }
  async session() {
    return validatedSession(await this.request<Session | null>("/session"));
  }
  async login({ email, password }: Credentials) {
    const session = validatedSession(
      await this.request<Session>(email === undefined ? "/session/student" : "/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email === undefined ? { password } : { email: email.trim(), password }),
      }),
    );
    if (!session) throw new Error("No se ha podido iniciar sesión.");
    if (email === undefined ? session.role !== "student" : session.role === "student") {
      await this.logout();
      throw new Error("El servicio ha devuelto un perfil incorrecto para este acceso.");
    }
    return session;
  }
  async logout() {
    await this.request("/session", { method: "DELETE" });
  }
  async users() { return this.request<StaffUser[]>("/users"); }
  async createUser(input: NewStaffUser) {
    await this.request('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  }
  async updateUser(id: string, input: StaffUserChanges) {
    await this.request(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  }
  async materials() {
    return (await this.request<Material[]>("/materials")).map(normalizeMaterial);
  }
  async saveMaterial(input: MaterialInput, file?: File, id?: string) {
    validateMaterial(input);
    if (file) validateFile(file);
    const form = new FormData();
    Object.entries({
      course: input.course,
      section: input.section,
      title: input.title.trim(),
      topic: input.topic.trim(),
      block: input.section === "exercises" ? input.block.trim() : "",
    }).forEach(([key, value]) => form.set(key, value));
    if (file) form.set("file", file);
    await this.request(`/materials${id ? `/${encodeURIComponent(id)}` : ""}`, {
      method: id ? "PATCH" : "POST",
      body: form,
    });
  }
  async deleteMaterial(id: string) {
    await this.request(`/materials/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
  async download(id: string) {
    const response = await fetch(
      `${this.base}/materials/${encodeURIComponent(id)}/file`,
      {
        credentials: "include",
        cache: "no-store",
        redirect: "error",
        headers: { "X-Requested-With": "ClubPalentino" },
      },
    );
    if (response.status === 401) window.dispatchEvent(new Event(sessionExpiredEvent));
    if (!response.ok)
      throw new Error(
        "No se pudo descargar el archivo. Comprueba tu sesión e inténtalo de nuevo.",
      );
    return response.blob();
  }
  async tournaments() {
    return (await this.request<Tournament[]>("/tournaments")).map(safeTournament);
  }
  async saveTournament(input: TournamentInput, id?: string) {
    validateTournament(input);
    await this.request(
      `/tournaments${id ? `/${encodeURIComponent(id)}` : ""}`,
      {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
  }
  async deleteTournament(id: string) {
    await this.request(`/tournaments/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
  async news() {
    return (await this.request<NewsArticle[]>("/news")).map(safeNews);
  }
  async saveNews(input: NewsInput, image?: File, id?: string) {
    validateNews(input);
    if (image) {
      await readNewsImage(image);
      if (!input.imageAlt.trim())
        throw new Error("Describe brevemente la foto.");
    }
    const form = new FormData();
    Object.entries(input).forEach(([key, value]) => form.set(key, value));
    if (image) form.set("image", image);
    await this.request(`/news${id ? `/${encodeURIComponent(id)}` : ""}`, {
      method: id ? "PATCH" : "POST",
      body: form,
    });
  }
  async deleteNews(id: string) {
    await this.request(`/news/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}

export async function createRepository(): Promise<Repository> {
  const response = await fetch(`${import.meta.env.BASE_URL}config.json`, {
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("No se ha podido cargar la configuración de la web.");
  const config = await response.json();
  if (typeof config.apiBaseUrl !== "string")
    throw new Error("La configuración del servicio no es válida.");
  if (config.apiBaseUrl === "") return new DemoRepository();
  // Relative API paths support deployment behind the same HTTPS origin.
  let url: URL;
  try { url = new URL(config.apiBaseUrl, location.origin); }
  catch { throw new Error("La configuración del servicio no es válida."); }
  if (url.username || url.password || url.search || url.hash ||
      (config.apiBaseUrl.startsWith("/") && url.origin !== location.origin))
    throw new Error("La configuración del servicio no es válida.");
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      ["localhost", "127.0.0.1"].includes(location.hostname)
    )
  )
    throw new Error("El servicio debe utilizar HTTPS.");
  return new RemoteRepository(url.href.replace(/\/$/, ""));
}
