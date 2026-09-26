import { expect, type Page } from "@playwright/test";
import type { Material, Session } from "../src/types";

const installed = new WeakSet<Page>();
// Test-only API: exercises the real HTTP client without publishing test accounts.
export async function mockApi(page: Page, initialMaterials: Partial<Material>[] = []) {
  if (installed.has(page)) return;
  installed.add(page);
  let session: Session | null = null;
  const collections: Record<string, Record<string, unknown>[]> = {
    materials: initialMaterials as Record<string, unknown>[], tournaments: [], news: [],
  };
  const files = new Map<string, Buffer>();
  await page.route("**/config.json", (route) => route.fulfill({ json: { apiBaseUrl: "http://127.0.0.1:4173/api" } }));
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const [resource, id, filePath] = new URL(request.url()).pathname.slice(5).split("/");
    if (resource === "session") {
      if (method === "DELETE") { session = null; return route.fulfill({ status: 204 }); }
      if (method === "POST") {
        const input = request.postDataJSON();
        const roles = { "profesor@example.test": "teacher", "admin@example.test": "admin" } as const;
        const role = id === "student" ? "student" : roles[input.email as keyof typeof roles];
        if (!role || input.password !== "test-password" || "role" in input) return route.fulfill({ status: 401 });
        session = { role, name: "Cuenta de prueba" };
      }
      return route.fulfill({ json: session });
    }
    const rows = collections[resource];
    if (!rows) return route.fulfill({ status: 404 });
    if (resource === "materials" && !session) return route.fulfill({ status: 401 });
    if (method === "GET") {
      if (filePath === "file") return route.fulfill({ contentType: "application/octet-stream", body: files.get(id) ?? Buffer.from("prueba") });
      return route.fulfill({ json: rows });
    }
    if (!session || session.role === "student" || (resource !== "materials" && session.role !== "admin"))
      return route.fulfill({ status: session ? 403 : 401 });
    if (method === "DELETE") {
      collections[resource] = rows.filter((row) => row.id !== id);
      files.delete(id);
      return route.fulfill({ status: 204 });
    }
    const previous = rows.find((row) => row.id === id);
    const value: Record<string, unknown> = { ...previous, id: id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (resource === "tournaments") Object.assign(value, request.postDataJSON());
    else {
      const form = await new Response(request.postDataBuffer(), { headers: { "Content-Type": request.headers()["content-type"] } }).formData();
      for (const [key, item] of form) {
        if (typeof item === "string") value[key] = item;
        else if (key === "image") {
          // Chromium omits disk-backed file bytes from intercepted postData.
          // Read the selected test file for this mock's storage response.
          value.imageUrl = await page.locator('input[type="file"]').evaluate(async (input: HTMLInputElement) => {
            const file = input.files![0];
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            });
          });
        }
        else if (key === "file") {
          value.filename = item.name; value.size = item.size;
          files.set(value.id as string, Buffer.from(await item.arrayBuffer()));
        }
      }
      if (resource === "news") value.imageUrl ??= "";
    }
    collections[resource] = [...rows.filter((row) => row.id !== value.id), value];
    return route.fulfill({ status: 204 });
  });
}

export async function login(page: Page, role: "Alumnado" | "Profesor" | "Admin") {
  await mockApi(page);
  await page.goto(role === "Alumnado" ? "/#/acceso" : "/#/acceso-equipo");
  const email = { Alumnado: "alumno", Profesor: "profesor", Admin: "admin" }[role];
  if (role !== "Alumnado") await page.getByLabel("Correo electrónico").fill(`${email}@example.test`);
  await page.getByLabel(role === "Alumnado" ? "Contraseña de las clases" : "Contraseña", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(role === "Alumnado" ? /#\/aula$/ : /#\/panel$/);
}
