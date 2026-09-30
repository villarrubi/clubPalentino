# SEO de la web

Las páginas públicas usan URL propias: `/`, `/escuela`, `/torneos`, `/noticias`, `/contacto` y `/noticias/:id`. El servidor Node entrega para cada una un título, descripción, URL canónica, etiquetas sociales y contenido HTML inicial. Las noticias incluyen datos estructurados `Article`. Los enlaces antiguos con `#/...` siguen funcionando en la aplicación.

El sitemap de producción en `/sitemap.xml` añade automáticamente las noticias publicadas. Las rutas privadas, los accesos y el panel no figuran en él. El archivo `public/sitemap.xml` contiene las secciones fijas para una vista estática, pero el SEO completo requiere el servidor Node de producción.

Tras desplegar en `https://clubpalentinoajedrez.es`, comprobar `/robots.txt`, `/sitemap.xml` y el HTML de `/escuela` y de una noticia. Dar de alta el dominio en Google Search Console y enviar `https://clubpalentinoajedrez.es/sitemap.xml`. Esta última acción requiere acceso a la propiedad del dominio y no se realiza desde el repositorio.

Las descripciones y los datos del curso 2026/2027 están en `server/seo.mjs`; revisarlos al cambiar el curso, horarios, ubicación o teléfono.
