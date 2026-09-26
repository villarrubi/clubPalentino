import type { NewsInput } from "./types";

export const acceptNewsImages = "image/jpeg,image/png,image/webp";

export function validateNews(input: NewsInput) {
  if (!input.title.trim() || !input.summary.trim() || !input.content.trim())
    throw new Error("Completa el título, el resumen y el texto de la noticia.");
  if (
    input.title.length > 160 ||
    input.summary.length > 300 ||
    input.content.length > 20000 ||
    input.imageAlt.length > 200 ||
    input.source.length > 100
  )
    throw new Error("Revisa la longitud de los campos de la noticia.");
  const date = new Date(`${input.date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.date
  )
    throw new Error("Introduce una fecha válida.");
  if (input.url) {
    try {
      if (new URL(input.url).protocol !== "https:") throw new Error();
    } catch {
      throw new Error(
        "El enlace debe ser una dirección completa que empiece por https://.",
      );
    }
  }
}

export async function readNewsImage(file: File): Promise<string> {
  if (!acceptNewsImages.split(",").includes(file.type))
    throw new Error("Formato no admitido. Elige una foto JPG, PNG o WebP.");
  if (!file.size || file.size > 5 * 1024 * 1024)
    throw new Error("La foto debe tener contenido y no superar los 5 MB.");
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se ha podido leer la foto."));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = data;
  try {
    await image.decode();
  } catch {
    throw new Error("No se puede abrir esta foto. Selecciona otra imagen.");
  }
  return data;
}
