# Club Palentino de Ajedrez

Web del club, Escuela Club Palentino y biblioteca de materiales. React + TypeScript + Vite, con servidor Node.js 24 y SQLite. Despliegue completo en OVH con Docker y HTTPS.

**Web del club:** https://clubpalentinoajedrez.es/

**¿Has cambiado el código y quieres publicarlo? → [Guía paso a paso para actualizar la web](docs/ACTUALIZAR.md).** Incluye cómo subir los cambios a GitHub, conectar desde Windows y actualizar OVH conservando los datos.

## Contenido

- Inicio, Escuela Club Palentino, próximos torneos, noticias y contacto.
- Escuela 2026/2027, para todas las edades y niveles: viernes lectivos del 2 de octubre de 2026 al 28 de mayo de 2027; iniciación 18:00-19:00 y avanzado 19:00-20:00; 30 € por alumno y trimestre.
- Clases en CEAS José M.ª Fernández Nieto, C/ Camino de los Hoyos, 5, 34003 Palencia. Grupos flexibles, excepto festivos y vacaciones escolares.
- Contacto por llamada, WhatsApp con texto preparado y correo electrónico. Los mensajes se revisan y envían desde la aplicación correspondiente.
- Materiales de iniciación y avanzado, agrupados por tema, con buscador, filtro y descarga.
- Profesor: crear, editar, sustituir y eliminar archivos. Administrador: lo anterior y gestión de torneos y noticias con foto propia.
- Tema claro y tema azul profundo, con preferencia de sistema y selector manual.

## Acceso y área de alumnos

El aula es privada: los alumnos entrarán con la **contraseña de las clases**, sin correo ni elección de rol. El servidor comprueba esa contraseña y emite una sesión exclusivamente de alumno. Es un acceso compartido: no identifica a cada alumno ni permite revocar solo a uno.

Profesores y administradores comparten un formulario independiente en `#/acceso-equipo` con **correo y contraseña personal**. No hay enlaces a ese formulario en el menú, el pie de página ni el acceso de alumnos. La ruta directa `#/panel` también solicita esas credenciales si no hay sesión. El servidor asigna los permisos de la cuenta, sin recibir un rol elegido por el visitante. La dirección discreta no es un mecanismo de autorización.

**GitHub Pages:** publica solo archivos estáticos y mantiene el aula bloqueada con `apiBaseUrl` vacío. **Servidor completo:** `server/` implementa autenticación, autorización y almacenamiento privado, y sirve web y API en el mismo dominio. No contiene cuentas ni contraseñas predeterminadas. Sigue [DESPLIEGUE.md](docs/DESPLIEGUE.md) para activar los accesos. No subir materiales privados al repositorio ni a `public/`.

Las sesiones antiguas de demostración se descartan. El repositorio local deniega leer o descargar materiales y cualquier escritura, incluso al invocarlo directamente. Conserva los antiguos datos de prueba de IndexedDB en ese navegador sin mostrarlos en el aula; IndexedDB no es almacenamiento privado ni compartido. Los datos locales antiguos no se migran automáticamente: hay que volver a subir los materiales que se quieran conservar desde una cuenta del equipo.

Cada nivel tiene tres zonas: **Temario**, **Ejercicios** y **Recursos**. El temario y los recursos se agrupan por tema; los ejercicios, por bloques con nombre. El panel permite elegir sección, crear o reutilizar un bloque y reasignar materiales al editarlos. Los materiales anteriores sin sección aparecen en Temario. No hay tareas, notas ni seguimiento individual.

Formatos admitidos: PDF, PPT, PPTX, DOC, DOCX, ODT, ODP, PGN, ZIP y TXT; máximo 25 MB por archivo. Se pueden modificar título, nivel, sección, tema y bloque sin sustituir el archivo.

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
npm run build
npm run test:server
npx playwright install chromium
npm test
npm audit --audit-level=high
```

Playwright comprueba escritorio y móvil: navegación, enlaces profundos, contenido del curso, contacto, ambos niveles, bloqueo del aula sin servicio, contraseña de alumnos y acceso separado del equipo sin selector de rol, secciones y bloques, subida, edición, descarga y borrado de materiales, gestión de torneos, archivos rechazados, configuración fallida, tema oscuro y desbordamientos entre 320 y 1440 px. Las pruebas originales de gestión usan una API simulada. Además, `tests/backend.spec.ts` comprueba los tres accesos con el servidor real y el paquete de producción; `server/tests/security.test.mjs` prueba permisos, CSRF, archivos, caducidad y revocación directamente contra HTTP, sin depender de la interfaz. Las cuentas de estas pruebas son temporales y no se incluyen en el despliegue. Incluye análisis automatizado de accesibilidad con axe; no sustituye una auditoría manual completa ni una prueba en todos los dispositivos físicos.

## Publicación

La web de producción se ejecuta en el VPS de OVH. Un push a GitHub **no actualiza automáticamente el servidor**: sigue la [guía de actualización](docs/ACTUALIZAR.md).

El repositorio conserva el workflow `.github/workflows/deploy.yml`, que compila, ejecuta pruebas e intenta publicar los archivos estáticos en GitHub Pages. Ese despliegue es independiente de OVH y su disponibilidad depende de la configuración y el plan de GitHub para el repositorio privado. La dirección `github.io` no es la aplicación completa. Las rutas con `#` permiten recargar y compartir páginas sin reglas de servidor.

## Despliegue completo y usuarios

Ver [guía de despliegue y cuentas](docs/DESPLIEGUE.md), [contrato de API](docs/API.md) e [informe de seguridad](docs/SEGURIDAD.md).

| Rol | Acceso | Permisos |
| --- | --- | --- |
| Alumno | `#/acceso`, contraseña compartida de clase | Leer y descargar ambos niveles |
| Profesor | `#/acceso-equipo` o `#/panel`, correo y contraseña personal | Aula y alta, edición y borrado de materiales |
| Administrador | Mismo acceso del equipo, cuenta con rol admin | Lo anterior, noticias, torneos y usuarios del equipo |

El administrador dispone de **Panel → Usuarios** para crear cuentas del equipo, editar nombre y rol, cambiar contraseñas y desactivar/reactivar accesos. Cada cambio requiere su contraseña actual y revoca las sesiones de la cuenta modificada. No puede desactivarse a sí mismo, quitarse sus permisos ni dejar el club sin un administrador activo. La primera cuenta de administrador se crea con `npm run accounts` en el servidor; esa consola también permite recuperar accesos y cambiar la contraseña compartida de clases. No existe registro público ni recuperación automática por correo. El nombre de la ruta no concede permisos.

`public/config.json` sigue vacío para GitHub Pages. Al arrancar el servidor, `/config.json` devuelve automáticamente `{ "apiBaseUrl": "/api" }`. No hay que publicar credenciales ni editar el frontend. El servidor incluido exige el mismo origen y no admite conectar directamente una página de GitHub Pages con cookies entre dominios; para ello haría falta otro diseño de despliegue.

## Editar información pública

- `src/data.ts`: noticia de prensa inicial, contacto y datos generales del curso.
- Panel de administrador → Noticias: crear, editar o eliminar noticias; elegir o sustituir una foto JPG, PNG o WebP de hasta 5 MB. La última noticia aparece en portada y todas tienen página de lectura.
- `src/NewsPages.tsx` y `src/NewsForm.tsx`: noticias públicas y editor del administrador.
- `src/PublicPages.tsx`: contenido de inicio, escuela y contacto.
- `src/styles.css`: identidad visual, temas y diseño adaptable.
- `public/images/`: escudo facilitado por el club e imagen original generada para la portada.

Las clases se basan en el PDF y el cartel del curso facilitados por el club. El cartel de Maristas se utilizó solo como inspiración cromática: no se anuncia esa actividad. La noticia de El Norte de Castilla se presenta como enlace con su titular, fecha y una introducción propia; no se reproduce el artículo ni su fotografía. Su texto completo no estuvo accesible durante la preparación.

La dirección visual está documentada en [DESIGN.md](DESIGN.md). La procedencia y el prompt de la imagen están en [docs/ASSETS.md](docs/ASSETS.md).
