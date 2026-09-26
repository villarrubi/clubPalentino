# Club Palentino de Ajedrez

Web del club, Escuela Club Palentino y biblioteca de materiales. React + TypeScript + Vite, preparada para GitHub Pages y adaptable a móvil, tableta y ordenador.

Web: https://villarrubi.github.io/clubPalentino/

## Contenido

- Inicio, Escuela Club Palentino, próximos torneos, noticias y contacto.
- Escuela 2026/2027, para todas las edades y niveles: viernes lectivos del 2 de octubre de 2026 al 28 de mayo de 2027; iniciación 18:00-19:00 y avanzado 19:00-20:00; 30 € por alumno y trimestre.
- Clases en CEAS José M.ª Fernández Nieto, C/ Camino de los Hoyos, 5, 34003 Palencia. Grupos flexibles, excepto festivos y vacaciones escolares.
- Contacto por llamada, WhatsApp con texto preparado y correo electrónico. Los mensajes se revisan y envían desde la aplicación correspondiente.
- Materiales de iniciación y avanzado, agrupados por tema, con buscador, filtro y descarga.
- Profesor: crear, editar, sustituir y eliminar archivos. Administrador: lo anterior y gestión de torneos y noticias con foto propia.
- Tema claro y tema azul profundo, con preferencia de sistema y selector manual.

## Probar el área de alumnos y el panel

En `#/acceso`, selecciona Alumnado, Profesor o Admin. La contraseña de demostración para los tres perfiles es **palentino**.

Esta versión funciona en **modo de demostración local**. Los materiales, torneos, noticias y fotos se guardan en IndexedDB, solo en ese navegador y origen. Persisten al recargar, pero no se comparten entre dispositivos, usuarios o navegadores, y se pierden si se borran los datos del sitio. No hay seguimiento, tareas ni cuentas individuales de alumnos.

Los permisos de la demo sirven para probar las pantallas: **no constituyen autenticación ni protección real**. La contraseña es pública y el selector de perfil permite probar cualquiera de los roles. No utilizar materiales confidenciales. Las pruebas automáticas usan contextos aislados y no añaden contenido a la web publicada.

Formatos admitidos: PDF, PPT, PPTX, DOC, DOCX, ODT, ODP, PGN, ZIP y TXT; máximo 25 MB por archivo. Se pueden modificar título, nivel y tema sin sustituir el archivo.

## Desarrollo

Requiere Node.js 24 y npm.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## Comprobaciones

```sh
npx playwright install chromium
npm test
```

Playwright comprueba escritorio y móvil: navegación, enlaces profundos, contenido del curso, contacto, ambos niveles, permisos de la demo, persistencia, subida, edición, descarga y borrado de materiales, gestión de torneos, archivos rechazados, configuración fallida, tema oscuro y desbordamientos entre 320 y 1440 px. Incluye análisis automatizado de accesibilidad con axe; no sustituye una auditoría manual completa ni una prueba en todos los dispositivos físicos.

## Publicación

Cada push a `main` ejecuta `.github/workflows/deploy.yml`: instala dependencias, compila, ejecuta las pruebas y publica `dist` en GitHub Pages. En Settings → Pages, la fuente debe ser GitHub Actions. Las rutas con `#` permiten recargar y compartir páginas sin reglas de servidor.

## Conectar el servicio definitivo

`public/config.json` contiene `apiBaseUrl`. Vacío activa explícitamente la demo. Cuando exista un servicio compatible, indica su URL HTTPS; por ejemplo:

```json
{ "apiBaseUrl": "https://api.tu-dominio.es" }
```

Una carpeta o URL de almacenamiento por sí sola no basta: hay que implementar autenticación, autorización y almacenamiento en un servidor. El cliente remoto ya está preparado. El contrato y los requisitos están en [docs/API.md](docs/API.md). Si falla un servicio configurado, la aplicación no se cambia silenciosamente a la demo.

La autenticación futura prevista es contraseña común para alumnos y cuentas individuales de profesor/administrador, con roles decididos en el servidor. Los materiales deben permanecer fuera de este repositorio y de las carpetas públicas de GitHub Pages. Los datos de demostración no se migran automáticamente.

## Editar información pública

- `src/data.ts`: noticia de prensa inicial, contacto y datos generales del curso.
- Panel de administrador → Noticias: crear, editar o eliminar noticias; elegir o sustituir una foto JPG, PNG o WebP de hasta 5 MB. La última noticia aparece en portada y todas tienen página de lectura.
- `src/NewsPages.tsx` y `src/NewsForm.tsx`: noticias públicas y editor del administrador.
- `src/PublicPages.tsx`: contenido de inicio, escuela y contacto.
- `src/styles.css`: identidad visual, temas y diseño adaptable.
- `public/images/`: escudo facilitado por el club e imagen original generada para la portada.

Las clases se basan en el PDF y el cartel del curso facilitados por el club. El cartel de Maristas se utilizó solo como inspiración cromática: no se anuncia esa actividad. La noticia de El Norte de Castilla se presenta como enlace con su titular, fecha y una introducción propia; no se reproduce el artículo ni su fotografía. Su texto completo no estuvo accesible durante la preparación.

La dirección visual está documentada en [DESIGN.md](DESIGN.md). La procedencia y el prompt de la imagen están en [docs/ASSETS.md](docs/ASSETS.md).
