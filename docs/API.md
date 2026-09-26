# Contrato del servicio futuro

Estado: cliente implementado, servidor y almacenamiento pendientes de elegir y construir. No hay credenciales de producción en el repositorio.

## Configuración

Configurar `apiBaseUrl` en `public/config.json`. Las rutas siguientes son relativas a esa URL. HTTPS obligatorio, salvo localhost durante desarrollo. El cliente usa `credentials: include` y `X-Requested-With: ClubPalentino`.

El servidor debe responder con CORS limitado al origen de la web, permitir credenciales y la cabecera personalizada. Rechazar orígenes ajenos en todas las operaciones mutables y solicitudes sin cabecera. Gestionar OPTIONS, JSON y multipart. No utilizar `Access-Control-Allow-Origin: *` con credenciales.

Para cookies entre GitHub Pages y otro dominio, usar `HttpOnly; Secure; SameSite=None`, comprobar origen y aplicar protección CSRF. Los navegadores pueden bloquear cookies de terceros; se recomienda, al pasar a producción, web y API bajo el mismo dominio registrable o un proxy del mismo origen. Verificar ese comportamiento antes de activar el servicio.

## Sesión y permisos

| Método y ruta | Entrada | Respuesta |
| --- | --- | --- |
| GET /session | Cookie | `null` si no hay sesión; `{ "role": "student", "name": "Alumno" }` si la hay |
| POST /session | JSON `{role, password, email?}` | Sesión y cookie; error 401 para credenciales incorrectas |
| DELETE /session | Cookie | 204; revocar sesión y eliminar cookie |

Roles: `student`, `teacher`, `admin`. `role` en la petición de acceso indica el modo solicitado; **no concede privilegios**. Verificar rol y credenciales en el servidor. Para alumnos, contraseña común con hash y sesión limitada a `student`; para personal, correo y contraseña individuales, hash fuerte y rol persistido por el administrador. Añadir caducidad, revocación y limitación de intentos.

Todos los alumnos pueden leer los materiales de ambos niveles. No hay matrícula por curso, tareas, notas ni seguimiento.

## Materiales

| Método y ruta | Permiso | Entrada y respuesta |
| --- | --- | --- |
| GET /materials | Cualquier sesión | Array de metadatos |
| POST /materials | Profesor o admin | Multipart `title`, `topic`, `course`, `file`; 204 |
| PATCH /materials/:id | Profesor o admin | Multipart `title`, `topic`, `course`, `file?`; 204 |
| DELETE /materials/:id | Profesor o admin | Borrar metadatos y archivo; 204 |
| GET /materials/:id/file | Cualquier sesión | Binario del archivo, tras comprobar sesión |

Metadatos:

```json
{
  "id": "uuid",
  "title": "Finales de peones",
  "topic": "Finales",
  "course": "iniciacion",
  "filename": "finales.pdf",
  "size": 14500,
  "updatedAt": "2026-09-26T12:00:00.000Z"
}
```

`course` admite `iniciacion` o `avanzado`. Título obligatorio, hasta 160 caracteres; tema obligatorio, hasta 80. Normalizar espacios. Validar en el servidor extensión, MIME y contenido, tamaño (1 byte a 25 MB), nombre de descarga y permisos de cada operación. Extensiones: pdf, ppt, pptx, doc, docx, odt, odp, pgn, zip, txt. No confiar en la validación del navegador.

Almacenar los binarios en un contenedor privado y los metadatos en una base de datos. No exponer enlaces permanentes públicos. Usar respuestas autenticadas con `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` y políticas de caché apropiadas. Coordinar sustitución/borrado para evitar archivos huérfanos o referencias rotas.

## Torneos

| Método y ruta | Permiso | Entrada y respuesta |
| --- | --- | --- |
| GET /tournaments | Público | Array de torneos publicados |
| POST /tournaments | Admin | JSON sin `id`; 204 |
| PATCH /tournaments/:id | Admin | JSON sin `id`; 204 |
| DELETE /tournaments/:id | Admin | 204 |

```json
{
  "id": "uuid",
  "title": "Nombre del torneo",
  "date": "2026-10-10",
  "time": "18:00",
  "location": "Palencia",
  "description": "Información para participantes.",
  "url": "https://ejemplo.es/inscripcion"
}
```

Título, fecha real de calendario y lugar obligatorios. Hora, descripción y URL opcionales (cadena vacía). Fecha local en `YYYY-MM-DD`, hora `HH:mm`, zona Europe/Madrid. El enlace solo admite HTTPS. El frontend separa próximos y anteriores por fecha en Madrid. No interpreta HTML en los textos.

## Noticias

| Método y ruta | Permiso | Entrada y respuesta |
| --- | --- | --- |
| GET /news | Público | Array de noticias, incluido `imageUrl` público |
| POST /news | Admin | Multipart con los campos de texto e `image` opcional; 204 |
| PATCH /news/:id | Admin | Multipart con campos de texto e `image` opcional; 204 |
| DELETE /news/:id | Admin | Borrar noticia y foto asociada; 204 |

Campos de texto: `title` (obligatorio, hasta 160 caracteres), `date` (fecha real YYYY-MM-DD), `summary` (obligatorio, hasta 300), `content` (obligatorio, hasta 20000), `imageAlt` (hasta 200, obligatorio cuando hay foto), `source` (opcional, hasta 100) y `url` (opcional, solo HTTPS). Se muestran como texto, nunca como HTML. La publicación es inmediata; la fecha indica la fecha editorial, no programa una publicación futura.

La lectura añade `id`, `imageUrl` (cadena vacía si no hay foto) y `updatedAt` (ISO 8601). La portada muestra la noticia más reciente; Noticias muestra todas, ordenadas por fecha y actualización. Cada noticia tiene su página `#/noticias/:id`. El enlace externo es adicional al texto propio.

`image` admite JPEG, PNG y WebP de hasta 5 MB. Comprobar formato, contenido decodificable, tamaño y permisos en el servidor. Al editar sin imagen, conservar la foto anterior; al sustituirla, coordinar el reemplazo del archivo y los metadatos. Las fotos de noticias son públicas, a diferencia de los materiales. El servidor debe devolver URLs válidas para esas fotos y denegar cualquier escritura a visitantes, alumnos y profesores.

En la demo se utiliza IndexedDB versión 2: añade noticias sin borrar materiales, archivos o torneos existentes. La noticia de prensa original se importa una vez al crear el almacén; su borrado no la vuelve a importar. Las fotos se guardan como data URLs locales. El modo remoto necesita implementar estos endpoints antes de activarlo; la migración local no carga noticias en un servidor.

## Errores y puesta en marcha

- 401: sesión ausente/caducada o credenciales incorrectas.
- 403: sesión válida sin permiso suficiente.
- 400/413/415: entrada, tamaño o formato inválidos.
- 404: recurso inexistente.
- 429: límite de solicitudes.
- 5xx: error interno sin datos sensibles.

El cliente muestra errores seguros y no convierte fallos remotos en datos locales. Antes de activar: probar acceso y revocación, negativa de acceso directo a binarios, denegación de escritura para alumnos, denegación de torneos y noticias para profesores, CORS/CSRF y recuperación de copias. El servidor debe probar estos permisos independientemente de lo que muestre la interfaz.
