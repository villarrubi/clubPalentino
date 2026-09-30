# Revisión de seguridad — 30 de septiembre de 2026

## Alcance y conclusión

Revisión del código local, configuración, historial Git disponible, dependencias, frontend compilado y nueva API. El proyecto anterior solo implementaba la web y un cliente HTTP; sus formularios estaban bloqueados por falta de servidor. No había autenticación de producción que pudiera validarse ni usuarios reales configurados.

Se ha implementado el servidor y preparado el despliegue completo. **No equivale a un despliegue realizado ni a una garantía de ausencia de vulnerabilidades.** Falta configurar dominio/alojamiento, crear las credenciales reales, verificar HTTPS y restauración en ese alojamiento. No se ha realizado un pentest externo ni una revisión de infraestructura.

## Hallazgos y tratamiento

| Prioridad | Hallazgo | Resultado |
| --- | --- | --- |
| Bloqueante | No existían servidor de usuarios, permisos efectivos ni almacenamiento privado | API con permisos en cada endpoint y SQLite fuera del directorio público |
| Alta al conectar una API | Una sesión caducada podía dejar visible la interfaz privada hasta recargar | El cliente retira sesión al recibir 401, refresca al navegar/recuperar foco y sincroniza cambios entre pestañas |
| Alta al implantar cuentas | Faltaban hash, revocación, caducidad y límites de intentos | scrypt con sal, cookies protegidas, tokens aleatorios con hash, controles y pruebas en servidor |
| Media | URLs de noticias/torneos procedentes del servicio no se filtraban al leer | Filtro de enlaces HTTPS sin credenciales, rechazo de fotos SVG/HTML; validación adicional al escribir en servidor |
| Media | La URL configurada de API aceptaba credenciales incrustadas y partes inesperadas | Rechazo de usuario/contraseña, query y fragmento; HTTP solo en desarrollo local |
| Media | Solo había pruebas de permisos mediante API simulada | Matriz HTTP real para visitante y tres roles, más pruebas navegador-servidor |
| Operativa | GitHub Pages no puede ejecutar la API ni alojar documentos privados | Docker, Caddy, origen único, volúmenes y procedimiento de cuentas/copias |

No se han encontrado contraseñas reales, claves privadas o tokens de proveedores en los archivos e historial revisados mediante búsquedas de patrones. Las cadenas de contraseña halladas estaban en pruebas. Esto es una búsqueda acotada, no certifica que nunca se haya expuesto un secreto fuera del historial disponible. Las antiguas demos/roles del navegador no se aceptan como sesión; no se reutilizan sus credenciales.

## Controles implementados

- Roles decididos en el servidor: alumno lectura; profesor materiales; admin materiales, noticias, torneos y usuarios del equipo. Alterar DOM, storage o body no concede permisos.
- Sin cuentas predeterminadas. Contraseñas interactivas en terminal, scrypt con sal única (`N=2^17,r=8,p=1`), sin guardar texto claro.
- Cookies de producción `__Host-`, `Secure`, `HttpOnly`, `SameSite=Strict`; tokens de 256 bits, 8 horas absolutas y 30 minutos de inactividad. Logout y cambios de cuenta revocan sesiones.
- Origen exacto y cabecera obligatoria en mutaciones, sin CORS; límites por IP/cuenta, payload y concurrencia. Errores genéricos sin credenciales.
- Consultas parametrizadas. Binarios privados y metadatos se escriben/borran de forma atómica. Nombres no usados como rutas.
- Fotos decodificadas y convertidas a WebP, límites de bytes/píxeles, sin EXIF. Materiales comprobados por extensión/firma, descargados como adjuntos; sin interpretación de HTML en textos.
- CSP, HSTS, no-store en API y cabeceras del servidor; frontend sin tokens en localStorage/sessionStorage. Contraseña borrada del formulario tras intentar entrar.
- Contenedor sin root, volumen privado, raíz de solo lectura. CI ejecuta auditoría de dependencias y pruebas de servidor antes de publicar la web estática.

## Evidencia reproducible

```sh
npm run build
npm run test:server
npm test
npm audit --audit-level=high
```

El paquete de servidor prueba autenticación, cookies, rotación, logout, CSRF, matriz de permisos directamente por HTTP, archivos, fotos, fechas/URLs, rutas no públicas, cambio de credencial/rol, baja, límites persistentes y expiración. Las pruebas Playwright cubren escritorio y móvil, incluidos los tres accesos sobre el servidor real y `dist/`. El análisis npm no encontró vulnerabilidades conocidas al realizar esta revisión; debe repetirse antes de cada despliegue.

## Riesgos y límites pendientes

La contraseña de clases es compartida: no hay baja individual ni atribución por alumno. No existe MFA, recuperación por email, antivirus de documentos, registros detallados de auditoría ni copia automática programada. Son límites conocidos que deben valorarse según los usuarios y archivos reales; la guía indica cómo administrar el acceso actual.

El formato válido de un documento no demuestra que sea inocuo. El servidor no ejecuta documentos ni extrae ZIP, pero el equipo debe revisar el material que distribuye. El limitador global y de IP en memoria requiere una única instancia. La base y sus copias contienen datos privados y deben protegerse en el alojamiento. El motor Docker local no estaba disponible: se validó Compose, pero la imagen y el certificado deben comprobarse en el servidor de destino.

Referencias consultadas: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Node.js SQLite](https://nodejs.org/api/sqlite.html), [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).

## Gestión de usuarios desde el panel

Se incorpora Panel → Usuarios, limitado a administradores también en la API. Listados con campos explícitos, sin hashes ni sesiones; altas sin sobrescribir cuentas existentes; validación estricta; confirmación con contraseña actual del administrador; límite de 30 mutaciones por administrador/15 minutos y límite compartido de dos operaciones scrypt simultáneas con el login. Se comprueban de nuevo sesión, rol y credencial del administrador después del trabajo asíncrono. La actualización y revocación de sesiones se ejecutan en una transacción.

Se bloquea la modificación del acceso compartido de clase desde estas rutas, la autodesactivación, la retirada del propio rol admin y la baja/degradación del último administrador activo. Reactivar y cambiar contraseña son acciones separadas. Las pruebas incluyen acceso HTTP de todos los roles, CSRF, reautenticación, campos extra, duplicados, sesiones revocadas, contraseñas antiguas, cambios concurrentes entre administradores y flujos completos de navegador en móvil y escritorio.

Criterio de reautenticación: [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#require-re-authentication-for-sensitive-features).
