import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderSeoPage, renderSitemap } from '../seo.mjs';

const template = readFileSync(resolve('index.html'), 'utf8');
const origin = 'https://clubpalentinoajedrez.es';

test('las páginas públicas exponen contenido y metadatos propios en el HTML inicial', () => {
  const html = renderSeoPage(template, origin, '/escuela');
  assert.match(html, /<title>Clases de ajedrez en Palencia/);
  assert.match(html, /rel="canonical" href="https:\/\/clubpalentinoajedrez.es\/escuela"/);
  assert.match(html, /<h1>Escuela Club Palentino<\/h1>/);
  assert.match(html, /30 € por trimestre/);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.equal((html.match(/name="twitter:card"/g) || []).length, 1);
});

test('las noticias escapan su texto y aparecen en el sitemap con su URL canónica', () => {
  const article = {
    id: 'noticia-1', title: 'Torneo <script>alert(1)</script>',
    summary: 'Resumen & detalles', content: 'Contenido <p>sin HTML</p>',
    date: '2026-09-30', updatedAt: '2026-09-30T12:00:00Z',
    imageUrl: '', imageAlt: '',
  };
  const html = renderSeoPage(template, origin, '/noticias/noticia-1', { article });
  assert.match(html, /Contenido &lt;p&gt;sin HTML&lt;\/p&gt;/);
  assert.doesNotMatch(html, /<h1>.*<script>/);
  assert.match(html, /"@type":"Article"/);
  const sitemap = renderSitemap(origin, [article]);
  assert.match(sitemap, /<loc>https:\/\/clubpalentinoajedrez.es\/noticias\/noticia-1<\/loc><lastmod>2026-09-30<\/lastmod>/);
  assert.doesNotMatch(sitemap, /\/aula|\/panel/);
});
