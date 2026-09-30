# API del Club Palentino

Implementación: `server/app.mjs`, Node.js 24, Express y SQLite. La API vive en `/api`, en el mismo origen que la web. El servidor sirve únicamente `dist/`, nunca el repositorio o la base de datos. Configuración y operaciones: [DESPLIEGUE.md](DESPLIEGUE.md).

## Sesión

| Método y ruta | Entrada | Resultado |
| --- | --- | --- |
| GET /session | Cookie | `null` o `{ "role": "student", "name": "Alumno" }` |
| POST /session | JSON `{email, password}` | Cuenta personal de profesor/admin; cookie nueva |
| POST /session/student | JSON `{password}` | Exclusivamente alumno; cookie nueva |
| DELETE /session | Cookie | Revoca la sesión y borra cookie; 204 |

Contraseñas con scrypt y sal individual (`N=131072,r=8,p=1`). Altas mediante terminal, entre 15 y 128 caracteres; no se guardan ni muestran contraseñas. La identidad de clase interna `@class` no es un correo ni permite iniciar sesión de equipo. No existe registro abierto. El cliente no puede enviar `role`, `active`, identificadores ni permisos durante el login.

Sesiones opacas de 32 bytes aleatorios, guardadas como SHA-256; cookie de producción `__Host-club-session`, `HttpOnly; Secure; SameSite=Strict; Path=/`, máximo 8 horas y caducidad por 30 minutos sin peticiones autenticadas. Se comprueba la cuenta activa y su rol en cada solicitud. Login rota el token; logout, cambio de contraseña/rol y baja revocan sesiones. El cliente refresca al navegar, recuperar foco o recibir cambios de otra pestaña; un 401 retira el área privada. No puede retirar archivos que ya se hayan descargado.

Límites: 30 intentos por IP/15 minutos, 10 por cuenta personal/15 minutos y 20 por IP de clase/15 minutos. Los contadores por cuenta/clase persisten en SQLite. Un login correcto reinicia ese contador; los intentos por IP siguen contando. Máximo dos verificaciones scrypt simultáneas; exceso devuelve 503. Límite general: 300 solicitudes/minuto/IP. Los límites de memoria requieren una única instancia de app.

## Origen y transporte

Producción exige `APP_ORIGIN=https://dominio` exacto, sin ruta ni credenciales. Solo Caddy publica puertos; `TRUST_PROXY=1` es válido exclusivamente detrás de ese proxy. El puerto Node no debe exponerse.

Operaciones mutables, incluidos login y logout, requieren `Origin` igual a `APP_ORIGIN` y `X-Requested-With: ClubPalentino`. Se rechazan orígenes diferentes, `null` y `Sec-Fetch-Site: cross-site`. No se habilita CORS. JSON y multipart se analizan después de comprobar origen, límites y, para escritura de contenido, rol. Las llamadas CLI HTTP deben enviar ambas cabeceras.

Todas las respuestas API usan `Cache-Control: no-store`. CSP restringe scripts y conexiones al mismo origen, prohíbe objetos, bases y marcos; los estilos inline se permiten para las animaciones. También se envían HSTS en producción, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` y restricciones de cámara/micrófono/geolocalización.

## Materiales

| Método y ruta | Permiso | Entrada/salida |
| --- | --- | --- |
| GET /materials | Cualquier sesión | Array de metadatos |
| POST /materials | Profesor/admin | Multipart y archivo obligatorio; 204 |
| PATCH /materials/:id | Profesor/admin | Multipart, archivo opcional; 204 |
| DELETE /materials/:id | Profesor/admin | Borra metadatos y archivo; 204 |
| GET /materials/:id/file | Cualquier sesión | Binario privado como descarga adjunta |

Campos: `title` obligatorio hasta 160 caracteres; `topic` obligatorio hasta 80; `course` (`iniciacion`, `avanzado`); `section` (`syllabus`, `exercises`, `resources`); `block` hasta 80, obligatorio para ejercicios y vacío en otras secciones. Se rechazan campos desconocidos/duplicados y valores no textuales; se recortan espacios exteriores. Todos los alumnos acceden a ambos niveles.

Los metadatos añaden `id`, `filename`, `size`, `updatedAt`. Se guarda el binario en la misma fila SQLite para que creación, reemplazo y borrado sean atómicos. Los nombres no se usan como rutas. No hay directorio público de materiales ni enlaces permanentes sin autenticación.

Extensiones: PDF, PPT, PPTX, DOC, DOCX, ODT, ODP, PGN, ZIP, TXT. Hasta 25 MB. Se contrastan extensión y firma de contenido; TXT/PGN requieren UTF-8 sin NUL. Los formatos antiguos DOC/PPT comparten firma CFB. La descarga usa `application/octet-stream`, nombre saneado y `Content-Disposition: attachment`. **La comprobación de formato no es un antivirus**: PDF, Office y ZIP pueden contener contenido peligroso. Los ZIP no se extraen en el servidor. Solo el equipo de confianza debe subir archivos.

## Torneos

| Método y ruta | Permiso | Entrada/salida |
| --- | --- | --- |
| GET /tournaments | Público | Array de torneos |
| POST /tournaments | Admin | JSON; 204 |
| PATCH /tournaments/:id | Admin | JSON; 204 |
| DELETE /tournaments/:id | Admin | 204 |

Campos: `title` obligatorio hasta 160; `date` fecha real YYYY-MM-DD; `time` HH:mm o vacío; `location` obligatorio hasta 200; `description` hasta 3000; `url` hasta 2048, HTTPS sin usuario/contraseña o vacío. Lectura añade `id` y `updatedAt`. La web clasifica fechas en Europe/Madrid. Se muestran textos, nunca HTML.

## Noticias

| Método y ruta | Permiso | Entrada/salida |
| --- | --- | --- |
| GET /news | Público | Array de noticias |
| GET /news/:id/image | Público | Foto WebP |
| POST /news | Admin | Multipart; 204 |
| PATCH /news/:id | Admin | Multipart; 204 |
| DELETE /news/:id | Admin | Borra noticia y foto; 204 |

Campos: `title` obligatorio hasta 160; `date` fecha real YYYY-MM-DD; `summary` obligatorio hasta 300; `content` obligatorio hasta 20000; `imageAlt` hasta 200, obligatorio con foto; `source` hasta 100; `url` hasta 2048, HTTPS sin credenciales o vacío. Lectura añade `id`, `updatedAt` e `imageUrl` del mismo origen o vacío. Publicación inmediata; no se programa por fecha.

`image` admite JPEG, PNG y WebP, hasta 5 MB y 24 millones de píxeles. El servidor decodifica y convierte a WebP, elimina metadatos y limita a 2400×2400 sin ampliar. Una actualización sin foto conserva la anterior. Máximo dos cargas/procesados de contenido simultáneos. Los enlaces recibidos también se filtran en el cliente; no se interpreta HTML.

## Errores

401 sin sesión/credenciales incorrectas; 403 origen/permiso denegado; 400 entrada inválida; 413 tamaño; 415 formato; 404 recurso; 429 límite de intentos; 503 capacidad temporal; 500 error interno genérico. Nunca se devuelven hashes, tokens, consultas SQL o detalles internos. No se registran cuerpos, cookies ni contraseñas.

Pruebas: `npm run test:server` y `npm test`. El modo estático sin servicio conserva los datos locales antiguos, pero bloquea materiales y escrituras. No se migran automáticamente datos de IndexedDB al servidor.
