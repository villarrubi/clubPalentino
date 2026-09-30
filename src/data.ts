export const news = {
  title: "140 jugadores participan en el Memorial Alberto Acero de ajedrez",
  date: "2026-08-30",
  source: "El Norte de Castilla",
  description:
    "El ajedrez palentino, en la prensa. Consulta la noticia sobre la participación en el Memorial Alberto Acero.",
  url: "https://www.elnortedecastilla.es/palencia/140-jugadores-participan-memorial-alberto-acero-ajedrez-20260830102923-nt.html",
};

export const contact = {
  phone: "633 58 60 60",
  phoneLink: "tel:+34633586060",
  email: "clubpalentinoajedrez@gmail.com",
  emailLink: `mailto:clubpalentinoajedrez@gmail.com?subject=${encodeURIComponent("Información sobre la Escuela Club Palentino")}&body=${encodeURIComponent("Hola, me gustaría recibir información sobre las clases de ajedrez del curso 2026/2027. Gracias.")}`,
  whatsapp: `https://wa.me/34633586060?text=${encodeURIComponent("¡Hola! Me gustaría recibir información sobre la Escuela Club Palentino y las clases de ajedrez del curso 2026/2027.")}`,
  generalEmailLink: `mailto:clubpalentinoajedrez@gmail.com?subject=${encodeURIComponent("Consulta para el Club Palentino de Ajedrez")}&body=${encodeURIComponent("Hola, me gustaría contactar con el club. Gracias.")}`,
  generalWhatsapp: `https://wa.me/34633586060?text=${encodeURIComponent("¡Hola! Me gustaría contactar con el Club Palentino de Ajedrez.")}`,
  maps: "https://www.google.com/maps/search/?api=1&query=CEAS+Jose+Maria+Fernandez+Nieto+Camino+de+los+Hoyos+5+Palencia",
};
export const school = {
  season: "2026/2027",
  start: "2026-10-02",
  end: "2027-05-28",
  venue: "CEAS José M.ª Fernández Nieto",
  address: "C/ Camino de los Hoyos, 5",
  city: "34003 Palencia",
  price: "30 €",
};

export function formatDate(
  value: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(
    "es-ES",
    options ?? { day: "numeric", month: "long", year: "numeric" },
  ).format(new Date(`${value}T12:00:00`));
}
export function today() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)?.value)
    .join("-");
}
export function fileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`;
}
export const asset = (name: string) =>
  `${import.meta.env.BASE_URL}images/${name}`;
