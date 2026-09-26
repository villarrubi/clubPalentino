import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login } from "./mockApi";

test("noticias remotas: envía la foto y conserva el formulario si falla el servicio", async ({
  page,
}) => {
  let fail = true;
  let submitted = "";
  let contentType = "";
  await page.route("**/config.json", (route) =>
    route.fulfill({ json: { apiBaseUrl: "http://127.0.0.1:4173/api" } }),
  );
  await page.route("**/api/**", (route) => {
    const request = route.request();
    if (request.url().endsWith("/session"))
      return route.fulfill({ json: { role: "admin", name: "Administrador" } });
    if (request.method() === "POST" && request.url().endsWith("/news")) {
      submitted = request.postDataBuffer()?.toString() ?? "";
      contentType = request.headers()["content-type"];
      return route.fulfill({ status: fail ? 500 : 204 });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/panel");
  await page.getByRole("button", { name: "Noticias", exact: true }).click();
  await page
    .getByRole("button", { name: "Nueva noticia", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Título de la noticia").fill("Noticia remota");
  await dialog
    .getByLabel("Resumen", { exact: true })
    .fill("Resumen de la noticia");
  await dialog.getByLabel("Texto de la noticia").fill("Texto para publicar");
  await dialog
    .getByLabel("Foto de la noticia", { exact: true })
    .setInputFiles("public/images/logo-palentino.jpg");
  await dialog
    .getByLabel("Descripción de la foto", { exact: true })
    .fill("Escudo del club");
  await dialog.getByRole("button", { name: "Publicar noticia" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "El servicio no ha podido",
  );
  await expect(dialog.getByLabel("Título de la noticia")).toHaveValue(
    "Noticia remota",
  );
  await expect(dialog.locator(".news-image-preview")).toBeVisible();
  expect(contentType).toContain("multipart/form-data");
  expect(submitted).toContain('name="image"; filename="logo-palentino.jpg"');
  expect(submitted).toContain('name="title"');
  expect(submitted).toContain("Noticia remota");
  fail = false;
  await dialog.getByRole("button", { name: "Publicar noticia" }).click();
  await expect(dialog).not.toBeVisible();
});

async function openNewsPanel(page: Page) {
  await login(page, "Admin");
  await page.getByRole("button", { name: "Noticias", exact: true }).click();
}

test("noticias: foto, publicación pública, edición, sustitución y borrado persistentes", async ({
  page,
}, testInfo) => {
  await openNewsPanel(page);
  await page
    .getByRole("button", { name: "Nueva noticia", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Título de la noticia").fill("Encuentro del club");
  await dialog.getByLabel("Fecha de publicación").fill("2099-10-02");
  await dialog
    .getByLabel("Resumen", { exact: true })
    .fill("Una tarde de ajedrez compartida.");
  await dialog
    .getByLabel("Texto de la noticia")
    .fill(
      "Primera ronda y partidas amistosas.\n\nNos volvemos a encontrar el viernes.",
    );
  const upload = dialog.getByLabel("Foto de la noticia", { exact: true });
  await upload.setInputFiles({
    name: "no-es-foto.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("invalid"),
  });
  await expect(dialog.getByRole("alert")).toContainText("No se puede abrir");
  await expect(
    dialog.getByRole("button", { name: "Publicar noticia" }),
  ).toBeDisabled();
  await upload.setInputFiles({
    name: "grande.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(dialog.getByRole("alert")).toContainText("5 MB");
  await upload.setInputFiles("public/images/logo-palentino.jpg");
  await expect(
    dialog.getByAltText("Vista previa de la foto seleccionada"),
  ).toBeVisible();
  await dialog
    .getByLabel("Descripción de la foto", { exact: true })
    .fill("Escudo del Club Palentino");
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("editor-noticia.png") });
  await dialog.getByRole("button", { name: "Publicar noticia" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Noticias", exact: true }).click();
  await page.getByRole("button", { name: "Editar Encuentro del club" }).click();
  const original = await dialog
    .locator(".news-image-preview")
    .getAttribute("src");
  await dialog.getByLabel("Título de la noticia").fill("Encuentro de otoño");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Editar Encuentro de otoño" }).click();
  await expect(dialog.locator(".news-image-preview")).toHaveAttribute(
    "src",
    original!,
  );
  await upload.setInputFiles("public/images/ajedrez-hero-mobile.webp");
  await expect(dialog.locator(".news-image-preview")).not.toHaveAttribute(
    "src",
    original!,
  );
  await dialog
    .getByLabel("Descripción de la foto", { exact: true })
    .fill("Piezas de ajedrez sobre un tablero");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Encuentro de otoño" }),
  ).toBeVisible();
  await page.goto("/#/noticias");
  await page
    .getByRole("link", { name: "Encuentro de otoño", exact: true })
    .click();
  const articleUrl = page.url();
  await page.reload();
  await expect(page.locator("main h1")).toHaveText("Encuentro de otoño");
  await expect(page.locator(".news-body")).toContainText(
    "Nos volvemos a encontrar el viernes.",
  );
  await expect(
    page.getByAltText("Piezas de ajedrez sobre un tablero"),
  ).toHaveAttribute("src", /^data:image\/webp/);
  expect(
    await page
      .getByAltText("Piezas de ajedrez sobre un tablero")
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  await page.screenshot({
    path: testInfo.outputPath("noticia-publicada.png"),
    fullPage: true,
  });
  await openNewsPanel(page);
  await page
    .getByRole("button", { name: "Eliminar Encuentro de otoño" })
    .click();
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(
    page.getByRole("heading", { name: "Encuentro de otoño" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Eliminar Encuentro de otoño" })
    .click();
  await dialog
    .getByRole("button", { name: "Eliminar definitivamente" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Encuentro de otoño" }),
  ).toHaveCount(0);
  await page.goto(articleUrl);
  await expect(page.locator("main h1")).toHaveText(
    "Esta noticia ya no está disponible.",
  );
});

test("noticias: el servicio deniega escritura a profesores y alumnos", async ({ page }) => {
  for (const role of ["Profesor", "Alumnado"] as const) {
    await login(page, role);
    await expect(page.getByRole("button", { name: "Noticias", exact: true })).toHaveCount(0);
    const result = await page.evaluate(async () => {
      const path = "/src/repository.ts";
      const { createRepository } = await import(path);
      try { await (await createRepository()).deleteNews("noticia"); return "allowed"; }
      catch (error) { return (error as Error).message; }
    });
    expect(result).toContain("no tiene permiso");
    await page.getByRole("button", { name: role === "Profesor" ? "Cerrar sesión" : "Salir", exact: true }).click();
  }
});

test("migración: conserva torneos y archivos existentes al añadir noticias", async ({
  page,
}) => {
  await page.route("**/migration-test", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body></body></html>",
    }),
  );
  await page.goto("/migration-test");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("palentino-demo-v1", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore("materials", { keyPath: "id" });
        db.createObjectStore("files");
        db.createObjectStore("tournaments", { keyPath: "id" });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(
          ["materials", "files", "tournaments"],
          "readwrite",
        );
        tx.objectStore("materials").put({
          id: "old-material",
          title: "Clase anterior",
          topic: "Finales",
          course: "iniciacion",
          filename: "clase.txt",
          size: 8,
          updatedAt: "2026-09-26T12:00:00Z",
        });
        tx.objectStore("files").put(new Blob(["guardado"]), "old-material");
        tx.objectStore("tournaments").put({
          id: "old-tournament",
          title: "Torneo anterior",
          date: "2099-10-02",
          time: "",
          location: "Palencia",
          description: "",
          url: "",
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  await page.goto("/#/noticias");
  await expect(page.getByRole("heading", { name: /140 jugadores/ })).toBeVisible();
  await page.goto("/#/torneos");
  await expect(page.getByRole("heading", { name: "Torneo anterior" })).toBeVisible();
  await page.goto("/#/aula/iniciacion");
  await page.getByRole("button", { name: "Explorar el aula" }).click();
  await expect(page.getByRole("heading", { name: "Temario", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Clase anterior" })).toBeVisible();
  expect(
    await page.evaluate(async () => {
      const path = "/src/repository.ts";
      const { createRepository } = await import(path);
      return (await (await createRepository()).download("old-material")).text();
    }),
  ).toBe("guardado");
});
