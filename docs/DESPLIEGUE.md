# Despliegue completo y cuentas

Esta guía usa un servidor Linux con Docker Compose, un dominio y una única instancia de la aplicación. Web y API comparten origen, con HTTPS automático mediante Caddy. GitHub Pages por sí solo no ejecuta el servidor.

Dominio previsto: **clubpalentinoajedrez.es**, ya incluido en `.env.example`. El DNS debe apuntar al servidor que ejecute Docker; indicar el dominio en esta plantilla no cambia el DNS ni activa la API en GitHub Pages.

## 1. Preparar y comprobar

En desarrollo, Node.js 24:

```sh
npm ci
npm run build
npm run test:server
npx playwright install chromium
npm test
npm audit --audit-level=high
```

Los tests de integración sirven `dist/`: compilar antes de ejecutarlos. Para comprobar localmente la aplicación completa en PowerShell:

```powershell
$env:NODE_ENV='development'
$env:APP_ORIGIN='http://127.0.0.1:3000'
npm start
```

Abrir `http://127.0.0.1:3000`. Este modo usa una cookie de desarrollo sin `Secure` y solo admite localhost; no publicarlo en Internet. La base local está en `data/club.sqlite`, excluida de Git.

## 2. Preparar el servidor

1. Apuntar el registro DNS del dominio al servidor. Si hay registro AAAA, también debe llegar correctamente al servidor.
2. Permitir entrada a 80/tcp y 443/tcp (443/udp opcional). Reservar SSH a los responsables. No abrir el puerto 3000 ni publicar la base de datos.
3. Copiar el proyecto o clonar el repositorio en el servidor, instalar Docker/Compose y copiar `.env.example` a `.env`. Cambiar `DOMAIN` por el dominio real, sin `https://`, ruta ni puerto.
4. Arrancar:

```sh
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Caddy solicita el certificado y redirige HTTP a HTTPS. El contenedor app trabaja como usuario sin privilegios, con raíz de solo lectura y datos persistentes en `club_data`. No cambiar `TRUST_PROXY=1` salvo que se rediseñe la topología. No colocar otro proxy/CDN delante sin revisar cómo se obtiene la IP real para los límites de intentos.

`/config.json` lo genera el servidor con `/api`; no editar el archivo público para este despliegue. Las bases nuevas empiezan sin cuentas, materiales, torneos ni noticias. Las noticias públicas actuales o los materiales locales antiguos deben cargarse desde el panel. No hay importación automática desde IndexedDB.

## 3. Crear los tres accesos

Ejecutar en una terminal interactiva del servidor. Cambiar los correos y nombres por los reales:

```sh
docker compose exec app npm run accounts -- create administrador@tu-dominio.es admin "Responsable del club"
docker compose exec app npm run accounts -- create profesor@tu-dominio.es teacher "Profesor del club"
docker compose exec app npm run accounts -- student-password
docker compose exec app npm run accounts -- list
```

Cada alta pide la contraseña dos veces **sin mostrarla**. Debe tener entre 15 y 128 caracteres; usar una distinta para cada cuenta personal, generada y guardada en un gestor. No escribirla en el comando, `.env`, `config.json`, código, chat ni repositorio. No hay contraseñas predeterminadas. Los hashes scrypt se guardan únicamente en SQLite.

| Persona | Dirección | Credenciales | Puede hacer |
| --- | --- | --- | --- |
| Alumno | `https://clubpalentinoajedrez.es/#/acceso` | Contraseña de clase | Consultar y descargar ambos niveles |
| Profesor | `https://clubpalentinoajedrez.es/#/acceso-equipo` | Correo y contraseña personal | Lo anterior y crear/editar/eliminar materiales |
| Administrador | Mismo acceso del equipo, o `#/panel` | Correo y contraseña personal | Lo anterior y publicar/editar/eliminar torneos y noticias |

La ruta del equipo no aparece en el menú público, pero no es secreta ni otorga permisos. El servidor decide el rol. No hay selector de rol ni registro de usuarios desde la web.

Los alumnos comparten un acceso: cualquier persona que conozca esa contraseña puede leer ambos niveles. No hay identidad individual, matrícula ni baja por alumno. Para retirar el acceso a alguien que conoce la contraseña, cambiarla y distribuir la nueva al grupo autorizado. El cambio revoca todas las sesiones de alumnos. Nunca usar esa misma contraseña para una cuenta del equipo.

## 4. Administrar cuentas y recuperar el acceso

Estas operaciones requieren acceso técnico al servidor; el rol admin de la web gestiona contenido y no proporciona una consola de usuarios.

```sh
# Cambiar contraseña (también reactiva una cuenta desactivada)
docker compose exec app npm run accounts -- password profesor@tu-dominio.es

# Cambiar la contraseña de todas las clases
docker compose exec app npm run accounts -- student-password

# Dar de baja o cambiar permisos: revoca todas sus sesiones
docker compose exec app npm run accounts -- disable profesor@tu-dominio.es
docker compose exec app npm run accounts -- role profesor@tu-dominio.es admin

# Revocar sesiones sin cambiar contraseñas
docker compose exec app npm run accounts -- revoke profesor@tu-dominio.es
docker compose exec app npm run accounts -- revoke @class
docker compose exec app npm run accounts -- revoke all
```

No se puede desactivar/degradar al último administrador activo. No existe recuperación por correo: quien mantiene el servidor verifica la identidad por un canal conocido y cambia la contraseña en terminal. Si se pierde el único administrador, se puede crear otro mediante la consola del servidor. La sesión dura como máximo ocho horas y caduca tras treinta minutos sin peticiones autenticadas. La revocación se aplica en la siguiente solicitud; los archivos ya descargados no se pueden recuperar.

## 5. Verificar antes de abrir al público

- Acceder con los tres perfiles reales y confirmar la tabla de permisos, cerrar sesión y volver a entrar.
- Subir un material, descargarlo como alumno, copiar su ruta `/api/materials/:id/file` y comprobar que una ventana privada recibe 401.
- Probar una foto y un torneo desde administración; comprobar que el profesor no puede escribir en esas rutas aunque haga peticiones HTTP manuales.
- Confirmar HTTPS y cookie `Secure`, `HttpOnly`, `SameSite=Strict` en el dominio real; no hay credenciales en almacenamiento local.
- Crear una copia y restaurarla en un entorno separado antes de confiar en ella. Revisar espacio libre de disco y disponibilidad del servicio.

Estas comprobaciones en el servidor real no se han podido realizar desde el entorno local. Tampoco se ha construido la imagen aquí porque el motor Docker no estaba iniciado; la configuración Compose sí se ha validado. Las pruebas locales de servidor y navegador están automatizadas.

## 6. Copias y recuperación

SQLite guarda juntos cuentas, sesiones, metadatos y archivos. No copiar `club.sqlite` en caliente omitiendo sus archivos WAL. Utilizar la copia consistente incorporada (los siguientes comandos se ejecutan desde el directorio del proyecto en el servidor Linux):

```sh
mkdir -p backups
chmod 700 backups
docker compose exec app npm run accounts -- backup /data/backup.sqlite
docker compose cp app:/data/backup.sqlite ./backups/club.sqlite
chmod 600 backups/club.sqlite
```

Guardar versiones fechadas, cifradas y fuera del servidor; los comandos anteriores generan una sola copia y la siguiente sustituirá el archivo de destino. Programar la copia según la frecuencia de cambios y comprobar su recuperación. La copia contiene datos privados y hashes de contraseñas, aunque no las contraseñas en claro. No subirla a Git ni a la web. Proteger también el acceso administrativo y las claves SSH del alojamiento.

Para restaurar, probar primero en otra instancia. Detener la app; conservar aparte el volumen original con su WAL; restaurar la copia consistente como `club.sqlite` en **un volumen nuevo**, propiedad del usuario node (UID 1000); montar ese volumen, ejecutar `accounts revoke all` y arrancar. No mezclar una copia con WAL/SHM de otra base ni sobrescribir el único original. Configurar el nuevo volumen mediante un archivo Compose de recuperación revisado para el servidor concreto.

No ejecutar `docker compose down -v`: elimina los volúmenes. Las actualizaciones ordinarias usan `docker compose up -d --build` y conservan datos.

## Límites operativos

Una instancia de app, disco persistente y copias externas. Los límites de IP y concurrencia en memoria no se comparten entre réplicas. Para varios servidores hacen falta almacenamiento compartido y un limitador centralizado. Reservar memoria suficiente: Compose limita la app a 1 GB y scrypt usa aproximadamente 128 MB por verificación, con un máximo de dos simultáneas.

La validación de firmas y la descarga adjunta no detectan malware en PDF/Office/ZIP. Si van a subir archivos personas ajenas al equipo de confianza, añadir análisis antivirus/cuarentena antes de permitir descargas. No hay MFA en esta versión. Actualizar dependencias e imágenes regularmente y volver a pasar pruebas y auditoría.
