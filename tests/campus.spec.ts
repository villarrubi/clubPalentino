import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, mockApi } from "./mockApi";

test("acceso discreto del equipo y formularios separados accesibles", async ({ page }) => {
  await mockApi(page);
  await page.goto("/#/acceso");
  await expect(page.locator('a[href="#/acceso-equipo"], a[href="#/panel"]')).toHaveCount(0);
  await expect(page.getByLabel("Correo electrónico")).toHaveCount(0);
  await page.getByLabel("Contraseña de las clases").fill("student-password");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.goto("/#/acceso-equipo");
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: /^(Admin|Profesor|Alumnado)$/ })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("sin servicio: no permite entrar ni recuperar las antiguas sesiones de demo", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("palentino-session", JSON.stringify({ role: "admin", name: "Admin" }));
    sessionStorage.setItem("palentino-student-preview", "1");
  });
  await page.goto("/#/panel");
  await expect(page.getByRole("button", { name: /^(Admin|Profesor|Alumnado)$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Explorar el aula" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Subir material" })).toHaveCount(0);
  await page.goto("/#/aula/iniciacion");
  await expect(page.getByLabel("Contraseña de las clases")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeDisabled();
  const results = await page.evaluate(async () => {
    const path = "/src/repository.ts";
    const { createRepository } = await import(path);
    const repo = await createRepository();
    const results: string[] = [];
    sessionStorage.setItem("palentino-session", JSON.stringify({ role: "admin" }));
    for (const action of [
      () => repo.materials(), () => repo.download("x"),
      () => repo.saveMaterial({}), () => repo.deleteMaterial("x"),
      () => repo.saveTournament({}), () => repo.deleteTournament("x"),
      () => repo.saveNews({}), () => repo.deleteNews("x"),
    ]) {
      try { await action(); results.push("allowed"); }
      catch (error) { results.push((error as Error).message); }
    }
    return { results, session: await repo.session() };
  });
  expect(results.session).toBeNull();
  expect(results.results).toHaveLength(8);
  for (const result of results.results) expect(result).toContain("No tienes permiso");
});

test("alumnos: contraseña obligatoria sin correo ni selección de permisos", async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() => sessionStorage.setItem("palentino-session", JSON.stringify({ role: "admin" })));
  await page.goto("/#/aula");
  await expect(page.getByRole("button", { name: /^(Admin|Profesor|Alumnado)$/ })).toHaveCount(0);
  await expect(page.getByLabel("Correo electrónico")).toHaveCount(0);
  await expect(page.getByLabel("Contraseña de las clases")).toHaveAttribute("required", "");
  await page.getByLabel("Contraseña de las clases").fill("test-password");
  const request = page.waitForRequest((r) => r.url().endsWith("/session/student") && r.method() === "POST");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  expect((await request).postDataJSON()).toEqual({ password: "test-password" });
  await expect(page.getByRole("heading", { name: "Siempre una jugada por descubrir." })).toBeVisible();
  await page.goto("/#/panel");
  await expect(page.getByRole("heading", { name: "Este espacio es para el profesorado." })).toBeVisible();
  const denial = await page.evaluate(async () => {
    const path = "/src/repository.ts";
    const { createRepository } = await import(path);
    try { await (await createRepository()).deleteMaterial("x"); return "allowed"; }
    catch (error) { return (error as Error).message; }
  });
  expect(denial).toContain("no tiene permiso");
  await page.getByRole("link", { name: "Acceder con una cuenta de gestión" }).click();
  await page.getByRole("button", { name: "Acceder con otra cuenta" }).click();
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await page.getByLabel("Correo electrónico").fill("profesor@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("test-password");
  const staffRequest = page.waitForRequest((r) => r.url().endsWith("/session") && r.method() === "POST");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  expect((await staffRequest).postDataJSON()).toEqual({ email: "profesor@example.test", password: "test-password" });
  await expect(page.getByRole("button", { name: "Subir material", exact: true })).toBeVisible();
});

test("temario, recursos y ejercicios por bloques: búsqueda, niveles y accesibilidad", async ({ page }, testInfo) => {
  const base = { course: "iniciacion" as const, topic: "Táctica", filename: "clase.pdf", size: 100, updatedAt: "2026-09-27T12:00:00Z" };
  await mockApi(page, [
    { ...base, id: "legacy", title: "Las piezas y sus movimientos" },
    { ...base, id: "one", title: "Mate en una jugada", section: "exercises", block: "Bloque 1 · Jaque mate" },
    { ...base, id: "two", title: "Mate con dos torres", section: "exercises", block: "Bloque 1 · Jaque mate" },
    { ...base, id: "three", title: "El ataque doble", section: "exercises", block: "Bloque 2 · Táctica" },
    { ...base, id: "four", title: "Partidas para analizar", section: "resources", block: "" },
    { ...base, id: "five", title: "Cálculo avanzado", course: "avanzado", section: "exercises", block: "Bloque 1 · Cálculo" },
  ]);
  await login(page, "Alumnado");
  await page.screenshot({ path: testInfo.outputPath("niveles.png"), fullPage: true });
  await page.goto("/#/aula/iniciacion");
  await expect(page.getByRole("heading", { name: "Las piezas y sus movimientos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mate en una jugada" })).toHaveCount(0);
  await page.getByRole("button", { name: /^Ejercicios/ }).click();
  await expect(page.locator(".topic-group")).toHaveCount(2);
  await expect(page.locator(".topic-group").first().locator(".material-row")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Las piezas y sus movimientos" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Cálculo avanzado" })).toHaveCount(0);
  await page.getByLabel("Filtrar por bloque").selectOption("Bloque 2 · Táctica");
  await expect(page.locator(".material-row")).toHaveCount(1);
  await page.getByLabel("Buscar materiales").fill("no existe");
  await expect(page.getByRole("heading", { name: "No encontramos ese material" })).toBeVisible();
  await page.getByRole("button", { name: /^Recursos/ }).click();
  await expect(page.getByRole("heading", { name: "Partidas para analizar" })).toBeVisible();
  await page.getByRole("button", { name: /^Ejercicios/ }).click();
  await expect(page.locator(".topic-group")).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath("ejercicios-bloques.png"), fullPage: true });
  for (const dark of [false, true]) {
    if (dark) await page.getByRole("button", { name: "Activar tema oscuro" }).click();
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  }
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("navigation", { name: "Nivel de las clases" }).getByRole("link", { name: "Avanzado" }).click();
  await expect(page.getByRole("heading", { name: "Cálculo avanzado" })).toBeVisible();
});

test("profesor: crea un bloque, lo cambia y mueve ejercicios a recursos", async ({ page }) => {
  await login(page, "Profesor");
  await page.getByRole("button", { name: "Subir material", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Título del material").fill("Práctica de finales");
  await dialog.getByRole("combobox", { name: "Sección", exact: true }).selectOption("exercises");
  await dialog.getByLabel("Tema", { exact: true }).fill("Finales");
  await dialog.locator("input[type=file]").setInputFiles({ name: "finales.txt", mimeType: "text/plain", buffer: Buffer.from("Ejercicio 1") });
  await dialog.getByRole("button", { name: "Subir material", exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Bloque de ejercicios").fill("   ");
  await dialog.getByRole("button", { name: "Subir material", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Indica un bloque");
  await dialog.getByLabel("Bloque de ejercicios").fill("Bloque 1");
  await dialog.getByRole("button", { name: "Subir material", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Editar Práctica de finales" }).click();
  await expect(dialog.getByRole("combobox", { name: "Sección", exact: true })).toHaveValue("exercises");
  await expect(dialog.getByLabel("Bloque de ejercicios")).toHaveValue("Bloque 1");
  await dialog.getByLabel("Bloque de ejercicios").fill("Bloque 2");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(dialog).not.toBeVisible();
  await page.goto("/#/aula/iniciacion");
  await page.getByRole("button", { name: /^Ejercicios/ }).click();
  await expect(page.getByRole("heading", { name: /Bloque 2/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bloque 1/ })).toHaveCount(0);
  await page.goto("/#/panel");
  await page.getByRole("button", { name: "Editar Práctica de finales" }).click();
  await dialog.getByRole("combobox", { name: "Sección", exact: true }).selectOption("resources");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(dialog).not.toBeVisible();
  await page.goto("/#/aula/iniciacion");
  await page.getByRole("button", { name: /^Ejercicios/ }).click();
  await expect(page.getByRole("heading", { name: "Tus próximos ejercicios, aquí" })).toBeVisible();
  await page.getByRole("button", { name: /^Recursos/ }).click();
  await expect(page.getByRole("heading", { name: "Práctica de finales" })).toBeVisible();
});
