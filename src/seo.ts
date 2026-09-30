import type { NewsArticle } from "./types";

const club = "Club Palentino de Ajedrez";
const hero = "/images/editorial/ajedrez-hero.webp";

const pages: Record<string, { title: string; description: string }> = {
  "/": {
    title: `Club de ajedrez en Palencia | ${club}`,
    description: "Aprende, juega y comparte ajedrez en Palencia. Descubre la escuela, los próximos torneos y las noticias del Club Palentino de Ajedrez.",
  },
  "/escuela": {
    title: `Clases de ajedrez en Palencia | ${club}`,
    description: "Escuela de ajedrez en Palencia para iniciación y avanzado. Clases los viernes en el CEAS José M.ª Fernández Nieto. Curso 2026/2027.",
  },
  "/torneos": {
    title: `Torneos de ajedrez en Palencia | ${club}`,
    description: "Consulta los próximos torneos de ajedrez del Club Palentino: fechas, lugar y detalles para participar.",
  },
  "/noticias": {
    title: `Noticias de ajedrez en Palencia | ${club}`,
    description: "Actualidad, noticias y encuentros del Club Palentino de Ajedrez y del ajedrez en Palencia.",
  },
  "/contacto": {
    title: `Contacto y ubicación | ${club}`,
    description: "Contacta con el Club Palentino de Ajedrez para conocer las clases y los torneos. Teléfono 633 58 60 60. Clases en Camino de los Hoyos, 5, Palencia.",
  },
};

export function isPublicPath(path: string) {
  return path in pages || /^\/noticias\/[^/]+$/.test(path);
}

function meta(attribute: "name" | "property", key: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = value;
}

export function updatePublicSeo(path: string, article?: NewsArticle) {
  const page = article ? {
    title: `${article.title} | ${club}`,
    description: article.summary,
  } : pages[path] ?? (path.startsWith("/noticias/") ? pages["/noticias"] : undefined);
  if (!page) return;
  const url = `${location.origin}${path}`;
  const image = `${location.origin}${article?.imageUrl || hero}`;
  document.title = page.title;
  meta("name", "description", page.description);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = url;
  meta("property", "og:type", article ? "article" : "website");
  meta("property", "og:title", page.title);
  meta("property", "og:description", page.description);
  meta("property", "og:url", url);
  meta("property", "og:image", image);
  meta("property", "og:image:alt", article?.imageAlt || "Ajedrez en el Club Palentino");
  meta("name", "twitter:card", "summary_large_image");
  meta("name", "twitter:title", page.title);
  meta("name", "twitter:description", page.description);
  meta("name", "twitter:image", image);

  let structured = document.getElementById("article-structured-data");
  if (!article) {
    structured?.remove();
    return;
  }
  if (!structured) {
    structured = document.createElement("script");
    structured.id = "article-structured-data";
    structured.setAttribute("type", "application/ld+json");
    document.head.append(structured);
  }
  structured.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "Article",
    headline: article.title, description: article.summary, mainEntityOfPage: url,
    datePublished: article.date, dateModified: article.updatedAt,
    publisher: { "@type": "Organization", name: club, url: location.origin },
    ...(article.imageUrl ? { image } : {}),
  });
}
