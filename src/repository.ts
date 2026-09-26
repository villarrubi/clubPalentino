import type {
  Repository,
  NewsArticle,
  NewsInput,
  Session,
  Role,
  Material,
  MaterialInput,
  Tournament,
  TournamentInput,
} from "./types";
import { roleNames } from "./types";
import { news as pressNews } from "./data";
import { readNewsImage, validateNews } from "./newsValidation";

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
async function write(stores: string[], action: (tx: IDBTransaction) => void) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction(stores, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () =>
      reject(
        new Error(
          "No se pudo guardar. Comprueba el espacio disponible y los permisos del navegador.",
        ),
      );
    action(tx);
  });
}

// This repository is a local preview, not an authentication or security boundary.
class DemoRepository implements Repository {
  readonly mode = "demo" as const;
  async session(): Promise<Session | null> {
    try {
      const session = JSON.parse(
        sessionStorage.getItem("palentino-session") ?? "null",
      );
      return session && ["student", "teacher", "admin"].includes(session.role)
        ? session
        : null;
    } catch {
      return null;
    }
  }
  async login(role: Role, password: string) {
    if (
      !["student", "teacher", "admin"].includes(role) ||
      password !== "palentino"
    )
      throw new Error("La contraseña de demostración es palentino.");
    const session = { role, name: roleNames[role] };
    sessionStorage.setItem("palentino-session", JSON.stringify(session));
    return session;
  }
  async logout() {
    sessionStorage.removeItem("palentino-session");
  }
  private async allow(roles: Role[]) {
    const session = await this.session();
    if (!session || !roles.includes(session.role))
      throw new Error("Tu perfil no tiene permiso para realizar esta acción.");
  }
  async materials() {
    await this.allow(["student", "teacher", "admin"]);
    return read<Material[]>("materials");
  }
  async saveMaterial(input: MaterialInput, file?: File, id?: string) {
    await this.allow(["teacher", "admin"]);
    validateMaterial(input);
    if (file) validateFile(file);
    const previous = id
      ? await read<Material | undefined>("materials", id)
      : undefined;
    if (id && !previous)
      throw new Error("El material ya no existe. Actualiza la lista.");
    if (!file && !previous)
      throw new Error("Selecciona el archivo que quieres subir.");
    const material: Material = {
      ...input,
      title: input.title.trim(),
      topic: input.topic.trim(),
      id: id ?? crypto.randomUUID(),
      filename: file?.name ?? previous!.filename,
      size: file?.size ?? previous!.size,
      updatedAt: new Date().toISOString(),
    };
    await write(["materials", "files"], (tx) => {
      tx.objectStore("materials").put(material);
      if (file) tx.objectStore("files").put(file, material.id);
    });
  }
  async deleteMaterial(id: string) {
    await this.allow(["teacher", "admin"]);
    await write(["materials", "files"], (tx) => {
      tx.objectStore("materials").delete(id);
      tx.objectStore("files").delete(id);
    });
  }
  async download(id: string) {
    await this.allow(["student", "teacher", "admin"]);
    const blob = await read<Blob | undefined>("files", id);
    if (!blob)
      throw new Error(
        "No se encuentra el archivo. Pide al profesor que vuelva a subirlo.",
      );
    return blob;
  }
  async tournaments() {
    return read<Tournament[]>("tournaments");
  }
  async saveTournament(input: TournamentInput, id?: string) {
    await this.allow(["admin"]);
    validateTournament(input);
    await write(["tournaments"], (tx) =>
      tx.objectStore("tournaments").put({
        ...input,
        title: input.title.trim(),
        location: input.location.trim(),
        id: id ?? crypto.randomUUID(),
      }),
    );
  }
  async deleteTournament(id: string) {
    await this.allow(["admin"]);
    await write(["tournaments"], (tx) =>
      tx.objectStore("tournaments").delete(id),
    );
  }
  async news() {
    return read<NewsArticle[]>("news");
  }
  async saveNews(input: NewsInput, image?: File, id?: string) {
    await this.allow(["admin"]);
    validateNews(input);
    const previous = id
      ? await read<NewsArticle | undefined>("news", id)
      : undefined;
    if (id && !previous)
      throw new Error("La noticia ya no existe. Actualiza la lista.");
    const imageUrl = image
      ? await readNewsImage(image)
      : (previous?.imageUrl ?? "");
    if (imageUrl && !input.imageAlt.trim())
      throw new Error("Describe brevemente la foto.");
    const article: NewsArticle = {
      ...input,
      title: input.title.trim(),
      summary: input.summary.trim(),
      content: input.content.trim(),
      imageUrl,
      id: id ?? crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    await write(["news"], (tx) => tx.objectStore("news").put(article));
  }
  async deleteNews(id: string) {
    await this.allow(["admin"]);
    await write(["news"], (tx) => tx.objectStore("news").delete(id));
  }
}

class RemoteRepository implements Repository {
  readonly mode = "remote" as const;
  constructor(private base: string) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.base}${path}`, {
      ...init,
      credentials: "include",
      headers: { "X-Requested-With": "ClubPalentino", ...init?.headers },
    });
    if (!response.ok) {
      if (response.status === 401)
        throw new Error(
          "La sesión ha caducado o las credenciales no son correctas. Vuelve a acceder.",
        );
      if (response.status === 403)
        throw new Error("Tu perfil no tiene permiso para esta acción.");
      throw new Error(
        "El servicio no ha podido completar la operación. Inténtalo de nuevo.",
      );
    }
    return response.status === 204 ? (undefined as T) : response.json();
  }
  async session() {
    return this.request<Session | null>("/session");
  }
  async login(role: Role, password: string, email?: string) {
    return this.request<Session>("/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, password, email }),
    });
  }
  async logout() {
    await this.request("/session", { method: "DELETE" });
  }
  async materials() {
    return this.request<Material[]>("/materials");
  }
  async saveMaterial(input: MaterialInput, file?: File, id?: string) {
    validateMaterial(input);
    if (file) validateFile(file);
    const form = new FormData();
    Object.entries(input).forEach(([key, value]) => form.set(key, value));
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
        headers: { "X-Requested-With": "ClubPalentino" },
      },
    );
    if (!response.ok)
      throw new Error(
        "No se pudo descargar el archivo. Comprueba tu sesión e inténtalo de nuevo.",
      );
    return response.blob();
  }
  async tournaments() {
    return this.request<Tournament[]>("/tournaments");
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
    return this.request<NewsArticle[]>("/news");
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
  const url = new URL(config.apiBaseUrl);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("El servicio debe utilizar HTTPS.");
  return new RemoteRepository(config.apiBaseUrl.replace(/\/$/, ""));
}
