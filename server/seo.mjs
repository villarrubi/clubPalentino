const club = 'Club Palentino de Ajedrez';

const pages = {
  '/': {
    title: `Club de ajedrez en Palencia | ${club}`,
    description: 'Aprende, juega y comparte ajedrez en Palencia. Descubre la escuela, los próximos torneos y las noticias del Club Palentino de Ajedrez.',
    heading: 'Club de ajedrez en Palencia',
    body: 'Escuela de ajedrez para todas las edades y niveles, torneos y noticias del club en Palencia.',
  },
  '/escuela': {
    title: `Clases de ajedrez en Palencia | ${club}`,
    description: 'Escuela de ajedrez en Palencia para iniciación y avanzado. Clases los viernes en el CEAS José M.ª Fernández Nieto. Curso 2026/2027.',
    heading: 'Escuela Club Palentino',
    body: 'Clases de iniciación los viernes de 18:00 a 19:00 y de avanzado de 19:00 a 20:00. Curso 2026/2027 en el CEAS José M.ª Fernández Nieto, Camino de los Hoyos, 5, Palencia. Cuota de 30 € por trimestre.',
  },
  '/torneos': {
    title: `Torneos de ajedrez en Palencia | ${club}`,
    description: 'Consulta los próximos torneos de ajedrez del Club Palentino: fechas, lugar y detalles para participar.',
    heading: 'Torneos de ajedrez en Palencia',
    body: 'Calendario de torneos y encuentros del Club Palentino de Ajedrez.',
  },
  '/noticias': {
    title: `Noticias de ajedrez en Palencia | ${club}`,
    description: 'Actualidad, noticias y encuentros del Club Palentino de Ajedrez y del ajedrez en Palencia.',
    heading: 'Noticias del Club Palentino de Ajedrez',
    body: 'Actualidad del club y del ajedrez palentino.',
  },
  '/contacto': {
    title: `Contacto y ubicación | ${club}`,
    description: 'Contacta con el Club Palentino de Ajedrez para conocer las clases y los torneos. Teléfono 633 58 60 60. Clases en Camino de los Hoyos, 5, Palencia.',
    heading: 'Contacta con el Club Palentino de Ajedrez',
    body: 'Teléfono: 633 58 60 60. Correo: clubpalentinoajedrez@gmail.com. Clases en CEAS José M.ª Fernández Nieto, Camino de los Hoyos, 5, 34003 Palencia.',
  },
};

export const publicPaths = Object.keys(pages);

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function articlePath(article) {
  return `/noticias/${encodeURIComponent(article.id)}`;
}

export function renderSeoPage(template, origin, pathname, { article, news = [], tournaments = [] } = {}) {
  const page = article ? {
    title: `${article.title} | ${club}`,
    description: article.summary,
    heading: article.title,
    body: article.content,
  } : pages[pathname];
  if (!page) return null;
  const url = `${origin}${pathname}`;
  const image = article?.imageUrl ? `${origin}${article.imageUrl}` : `${origin}/images/editorial/ajedrez-hero.webp`;
  const extra = article ? {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: article.title, description: article.summary, mainEntityOfPage: url,
    datePublished: article.date, dateModified: article.updatedAt,
    publisher: { '@type': 'Organization', name: club, url: origin },
    ...(article.imageUrl ? { image } : {}),
  } : null;
  const head = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    '<meta name="robots" content="index, follow" />',
    '<meta property="og:locale" content="es_ES" />',
    `<meta property="og:type" content="${article ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${club}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(article?.imageAlt || 'Ajedrez en el Club Palentino')}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    ...(extra ? [`<script type="application/ld+json">${JSON.stringify(extra).replace(/</g, '\\u003c')}</script>`] : []),
  ].join('\n');
  const links = '<nav aria-label="Secciones del club"><a href="/escuela">Escuela</a> · <a href="/torneos">Torneos</a> · <a href="/noticias">Noticias</a> · <a href="/contacto">Contacto</a></nav>';
  const articles = pathname === '/noticias' || pathname === '/' ? news.map((item) =>
    `<li><a href="${escapeHtml(articlePath(item))}">${escapeHtml(item.title)}</a> <time datetime="${escapeHtml(item.date)}">${escapeHtml(item.date)}</time></li>`,
  ).join('') : '';
  const events = pathname === '/torneos' ? tournaments.map((item) =>
    `<li>${escapeHtml(item.title)} — <time datetime="${escapeHtml(item.date)}">${escapeHtml(item.date)}</time>, ${escapeHtml(item.location)}</li>`,
  ).join('') : '';
  const body = `<main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.body)}</p>${articles ? `<h2>Noticias</h2><ul>${articles}</ul>` : ''}${events ? `<h2>Torneos</h2><ul>${events}</ul>` : ''}${links}</main>`;
  return template
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/<link rel="canonical"[^>]*>/, '')
    .replace(/<meta property="og:[^>]*>/g, '')
    .replace(/<meta name="twitter:card"[^>]*>/, '')
    .replace('</head>', `${head}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

export function renderSitemap(origin, articles) {
  const urls = [
    ...publicPaths.map((path) => ({ path })),
    ...articles.map((article) => ({ path: articlePath(article), date: article.updatedAt?.slice(0, 10) })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ path, date }) => `  <url><loc>${escapeHtml(origin + path)}</loc>${date ? `<lastmod>${escapeHtml(date)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`;
}
