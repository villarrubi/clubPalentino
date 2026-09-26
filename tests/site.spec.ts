import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function login(page: Page, role: "Alumnado" | "Profesor" | "Admin") {
  await page.goto("/#/acceso");
  await page.getByRole("button", { name: role, exact: true }).click();
  await page.getByLabel(/Contraseña/).fill("palentino");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(role === "Alumnado" ? /#\/aula$/ : /#\/panel$/);
}

test("páginas públicas, contenido del curso, contacto y diseño adaptable", async ({
  page,
}, testInfo) => {
  // Static captures and contrast scans must include every section, not a mid-reveal frame.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of ["/", "/escuela", "/contacto", "/noticias", "/torneos"]) {
    await page.goto(`/#${route}`);
    await expect(page.locator("main h1")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, `Accesibilidad en ${route}`).toEqual([]);
  }
  await page.goto("/#/escuela");
  await expect(
    page.getByRole("heading", { name: "Escuela Club Palentino", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Viernes, de 18:00 a 19:00")).toBeVisible();
  await expect(page.getByText("Viernes, de 19:00 a 20:00")).toBeVisible();
  await expect(page.getByText("30 €", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Maristas")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("escuela.png"),
    fullPage: true,
  });
  await page.goto("/#/contacto");
  await expect(
    page.getByRole("link", { name: "633 58 60 60", exact: true }),
  ).toHaveAttribute("href", "tel:+34633586060");
  await expect(
    page.getByRole("link", { name: "Abrir WhatsApp" }),
  ).toHaveAttribute("href", /^https:\/\/wa.me\/34633586060\?text=/);
  await expect(
    page.getByRole("link", { name: "Enviar un correo" }),
  ).toHaveAttribute("href", /^mailto:clubpalentinoajedrez@gmail.com\?subject=/);
  await page.goto("/");
  await expect(page.locator(".hero-piece")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("inicio.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Activar tema oscuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const darkResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(darkResults.violations).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("inicio-oscuro.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(errors).toEqual([]);
});

test("scroll: caballo, capítulos, regreso y movimiento reducido", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".tiny-board")).toHaveCount(0);
  await expect(page.locator(".hero-piece")).toBeVisible();
  await page
    .getByRole("button", { name: "Cada partida tiene un comienzo" })
    .click();
  await expect(page.locator("#recorrido-titulo")).toBeFocused();
  await expect(page).toHaveURL(/\/$/);
  const journey = page.locator(".chess-journey");
  const knight = page.locator(".journey-knight");
  // Reaching each chapter changes the piece's actual board position, in both directions.
  for (const step of [0, 1, 2, 1, 0]) {
    await page.locator(`[data-chapter="${step}"]`).evaluate((element) => {
      scrollTo({
        top: element.getBoundingClientRect().top + scrollY - innerHeight * 0.4,
        behavior: "instant",
      });
    });
    await expect(journey).toHaveAttribute("data-active-step", String(step));
    const [x, y] = [
      [60, 340],
      [100, 260],
      [180, 220],
    ][step];
    await expect(knight).toHaveCSS(
      "transform",
      `matrix(1, 0, 0, 1, ${x}, ${y})`,
    );
    if (step === 2) {
      await expect(page.locator(".journey-path.traced")).toHaveCount(2);
      await page.screenshot({ path: testInfo.outputPath("recorrido.png") });
    }
  }
  const cta = page.locator(".contact-cta");
  await cta.getByRole("link").focus();
  await expect(cta).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".reveal-pending")).toHaveCount(0);
  await expect(knight).toHaveCSS("transition-duration", "0s");
  await expect(page.locator(".journey-visual")).toHaveCSS("position", "static");
  await expect(page.locator(".hero-piece")).toHaveCSS("animation-name", "none");
  await page.goto("/#/escuela");
  await page
    .getByRole("navigation", { name: "Enlaces del club" })
    .getByRole("link", { name: "Contacto", exact: true })
    .click();
  await expect(page.locator("main h1")).toHaveText("Hablemos de ajedrez.");
  await page.goto("/");
  await expect(journey).toHaveAttribute("data-active-step", "0");
});

test("activar animaciones con movimiento reducido: scroll real, pausa y persistencia", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator(".knight-photo")).toHaveAttribute(
    "src",
    /caballo-staunton\.webp$/,
  );
  await expect
    .poll(() =>
      page
        .locator(".knight-photo")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Activar animaciones" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  const piece = page.locator(".hero-piece");
  const before = await piece.evaluate((el) => getComputedStyle(el).transform);
  await page.evaluate(() => scrollTo({ top: 350, behavior: "instant" }));
  await expect
    .poll(() => piece.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(before);
  await page
    .locator('[data-chapter="1"]')
    .evaluate((el) =>
      scrollTo({
        top: el.getBoundingClientRect().top + scrollY - innerHeight * 0.4,
        behavior: "instant",
      }),
    );
  await expect(page.locator(".chess-journey")).toHaveAttribute(
    "data-active-step",
    "1",
  );
  await expect(page.locator(".journey-knight")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 100, 260)",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await page.getByRole("button", { name: "Pausar animaciones" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  const paused = await piece.evaluate((el) => getComputedStyle(el).transform);
  await page.evaluate(() => scrollTo({ top: 450, behavior: "instant" }));
  await expect(piece).toHaveCSS("transform", paused);
  await expect(page.locator(".reveal-pending")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
});

test("menú, enlaces profundos y página desconocida", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(
      page.getByRole("button", { name: "Cerrar menú" }),
    ).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Abrir menú" }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Abrir menú" }).click();
  }
  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("link", { name: "Escuela Club Palentino" })
    .click();
  await expect(page).toHaveURL(/#\/escuela$/);
  await page.reload();
  await expect(page.locator("main h1")).toHaveText("Escuela Club Palentino");
  await page.goto("/#/inexistente");
  await expect(
    page.getByRole("heading", { name: "Esta jugada no existe." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Volver al inicio" }).click();
  await expect(page.locator("main h1")).toContainText("La próxima");
});

test("alumnos: contraseña, dos niveles, persistencia y permisos", async ({
  page,
}) => {
  await page.goto("/#/aula/avanzado");
  await page.getByLabel("Contraseña de las clases").fill("incorrecta");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("palentino");
  await page.getByLabel("Contraseña de las clases").fill("palentino");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Clases de avanzado." }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Nivel de las clases" })
    .getByRole("link", { name: "Iniciación" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Clases de iniciación." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Clases de iniciación." }),
  ).toBeVisible();
  await page.goto("/#/panel");
  await expect(
    page.getByRole("heading", { name: "Este espacio es para el profesorado." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Subir material" }),
  ).toHaveCount(0);
});

test("profesor: subir, editar, descargar, buscar y eliminar materiales", async ({
  page,
}) => {
  await login(page, "Profesor");
  await expect(
    page.getByRole("button", { name: "Torneos", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Subir material", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("input[type=file]").setInputFiles({
    name: "practica.pgn",
    mimeType: "application/x-chess-pgn",
    buffer: Buffer.from('[Event "Clase"]\n1. e4 e5 *'),
  });
  await dialog.getByLabel("Título del material").fill("Finales de peones");
  await dialog.getByLabel("Tema", { exact: true }).fill("Finales");
  await dialog
    .getByRole("button", { name: "Subir material", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Finales de peones" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Editar Finales de peones" }).click();
  await dialog.getByLabel("Título del material").fill("Finales prácticos");
  await dialog
    .getByRole("combobox", { name: "Nivel", exact: true })
    .selectOption("avanzado");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await login(page, "Alumnado");
  await page.goto("/#/aula/avanzado");
  await expect(
    page.getByRole("heading", { name: "Finales prácticos" }),
  ).toBeVisible();
  await page.getByLabel("Buscar materiales").fill("No existe");
  await expect(
    page.getByRole("heading", { name: "No encontramos ese material" }),
  ).toBeVisible();
  await page.getByLabel("Buscar materiales").fill("");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Descargar Finales prácticos" })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("practica.pgn");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString()).toContain("1. e4 e5");
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await page.getByRole("button", { name: "Salir", exact: true }).click();
  await login(page, "Profesor");
  await page
    .getByRole("button", { name: "Eliminar Finales prácticos" })
    .click();
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(
    page.getByRole("heading", { name: "Finales prácticos" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Eliminar Finales prácticos" })
    .click();
  await dialog
    .getByRole("button", { name: "Eliminar definitivamente" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tu biblioteca empieza aquí" }),
  ).toBeVisible();
});

test("validación de archivos y accesibilidad del formulario", async ({
  page,
}) => {
  await login(page, "Profesor");
  await page
    .getByRole("button", { name: "Subir material", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("input[type=file]").setInputFiles({
    name: "programa.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("invalid"),
  });
  await expect(dialog.getByRole("alert")).toContainText("Formato no admitido");
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("administrador: crear, editar y eliminar torneos de la agenda", async ({
  page,
}) => {
  await login(page, "Admin");
  await page.getByRole("button", { name: "Torneos", exact: true }).click();
  await page.getByRole("button", { name: "Nuevo torneo", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre del torneo").fill("Torneo de prueba");
  await dialog.getByLabel("Fecha", { exact: true }).fill("2099-10-02");
  await dialog.getByLabel("Lugar", { exact: true }).fill("Palencia");
  await dialog.getByLabel("Descripción").fill("Encuentro de prueba local.");
  await dialog
    .getByRole("button", { name: "Publicar torneo", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Editar Torneo de prueba" }).click();
  await dialog.getByLabel("Nombre del torneo").fill("Torneo actualizado");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(dialog).not.toBeVisible();
  await page.goto("/#/torneos");
  await expect(
    page.getByRole("heading", { name: "Torneo actualizado" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Torneos anteriores", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Todavía no hay torneos anteriores" }),
  ).toBeVisible();
  await page.goto("/#/panel");
  await page.getByRole("button", { name: "Torneos", exact: true }).click();
  await page
    .getByRole("button", { name: "Eliminar Torneo actualizado" })
    .click();
  await dialog
    .getByRole("button", { name: "Eliminar definitivamente" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Un calendario por estrenar" }),
  ).toBeVisible();
});

test("no cambia a demo si falla la configuración remota", async ({ page }) => {
  await page.route("**/config.json", (route) =>
    route.fulfill({ status: 500, body: "Error" }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "No hemos podido abrir la web." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Volver a intentar" }),
  ).toBeVisible();
});

test("sin desbordamientos en teléfono pequeño, tableta y portátil", async ({
  page,
}) => {
  for (const width of [320, 768, 820, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/escuela", "/contacto", "/acceso"]) {
      await page.goto(`/#${route}`);
      await expect(page.locator("main h1")).toBeVisible();
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          { message: `${route} a ${width}px` },
        )
        .toBe(true);
    }
  }
});
