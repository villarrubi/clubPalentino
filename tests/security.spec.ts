import { test, expect } from '@playwright/test';
import { mockApi } from './mockApi';

test('rechaza configuración con credenciales, consultas y protocolos no seguros', async ({ page }) => {
  for (const apiBaseUrl of ['https://user:secret@example.test/api', 'https://example.test/api?token=x', 'javascript:alert(1)', '//evil.example.test/api']) {
    await page.route('**/config.json', (route) => route.fulfill({ json: { apiBaseUrl } }));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'No hemos podido abrir la web.' })).toBeVisible();
    await page.unroute('**/config.json');
  }
});

test('no acepta un rol de equipo devuelto por el acceso de alumnos', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/session/student', (route) => route.fulfill({ json: { role: 'admin', name: 'Incorrecto' } }));
  await page.goto('/#/acceso');
  await page.getByLabel('Contraseña de las clases').fill('test-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('perfil incorrecto');
  await expect(page.getByLabel('Contraseña de las clases')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Subir material' })).toHaveCount(0);
});

test('filtra enlaces peligrosos y fotos SVG procedentes del servicio', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/news', (route) => route.fulfill({ json: [{ id: 'unsafe', title: 'Noticia', date: '2026-09-30',
    updatedAt: '2026-09-30T12:00:00Z', summary: 'Resumen', content: '<script>alert(1)</script>', source: '', imageAlt: '',
    url: 'javascript:alert(1)', imageUrl: 'data:image/svg+xml,<svg onload="alert(1)"/>' }] }));
  await page.goto('/#/noticias/unsafe');
  await expect(page.getByRole('heading', { name: 'Noticia', exact: true })).toBeVisible();
  await expect(page.locator('.news-body')).toHaveText('<script>alert(1)</script>');
  await expect(page.locator('a[href^="javascript:"], img[src^="data:image/svg"]')).toHaveCount(0);
});
