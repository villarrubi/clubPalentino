# Dar a conocer la web en Google

El sitio público se aloja en https://clubpalentinoajedrez.es/. La visibilidad del repositorio de GitHub no controla la indexación de esta web.

## Configuración incluida

- Título, descripción y dirección canónica del dominio principal en el HTML.
- Datos estructurados del club con su nombre, logo y contacto público.
- Metadatos Open Graph para compartir la portada.
- `robots.txt` permite el rastreo y anuncia `sitemap.xml`, que incluye la portada.
- Caddy redirige HTTP a HTTPS y `www` al dominio principal.

Estas etiquetas se publican al reconstruir la aplicación en el VPS; un push no actualiza el servidor automáticamente. Con el repositorio privado, configurar primero acceso de lectura desde el VPS a GitHub. Después, desde el directorio del proyecto:

```sh
git pull --ff-only && sudo docker compose up -d --build
```

Comprobar que `/sitemap.xml` devuelve XML y que la portada contiene las etiquetas antes de enviar el sitemap a Google.

## Search Console

1. Entrar en https://search.google.com/search-console con una cuenta responsable del club.
2. Añadir una propiedad de tipo **Dominio**: `clubpalentinoajedrez.es`.
3. Copiar el valor TXT de verificación que proporciona Google.
4. En la zona DNS de OVH, añadir una entrada TXT en la raíz (`@` o campo vacío según el formulario) con ese valor. Mantener los registros existentes, incluidos los de correo.
5. Volver a Search Console y verificar. Conservar el TXT tras la verificación.
6. Inspeccionar `https://clubpalentinoajedrez.es/`, probar la URL publicada y solicitar indexación.
7. Una vez desplegado el archivo, enviar `https://clubpalentinoajedrez.es/sitemap.xml` en **Sitemaps**.

Google decide cuándo rastrea e indexa la web y qué título y descripción muestra. Ni el sitemap ni la solicitud garantizan indexación o una posición concreta. Evitar repetir solicitudes para la misma URL.

## Noticias y otras secciones

La aplicación utiliza actualmente rutas con fragmentos (`#/noticias`, etc.). No incluir esas direcciones en el sitemap: no son páginas independientes para Google. La portada puede ser renderizada e indexada, pero para posicionar cada noticia es necesario migrar la navegación a rutas HTTP reales, conservar los enlaces antiguos y proporcionar metadatos específicos por página. Es recomendable servir el contenido público ya renderizado en HTML.

Las cuentas y materiales privados siguen protegidos por la API; `robots.txt` no sustituye la autenticación. No incluir materiales privados ni rutas de administración en el sitemap.

## Referencias

- https://support.google.com/webmasters/answer/9008080?hl=es
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=es
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=es
