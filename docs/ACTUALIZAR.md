# Cómo actualizar la web del club

Web pública: **https://clubpalentinoajedrez.es/**

Los cambios de código siguen este recorrido:

**Tu ordenador → GitHub → servidor OVH → web pública.**

Subir un cambio a GitHub no lo publica automáticamente en OVH. En cambio, las noticias, materiales y usuarios que guardas desde el panel de la web se guardan directamente en el servidor: para esos cambios no hay que usar Git ni reconstruir la aplicación.

## Dónde ejecutar cada comando

| Lo que ves al principio de la línea | Dónde estás | Qué se hace aquí |
| --- | --- | --- |
| `PS C:\Users\User\...>` | Tu ordenador, PowerShell | Comprobar el código, subirlo a GitHub y conectar por SSH |
| `ubuntu@vps-bbf37ab0:~$` | Servidor OVH | Descargar los cambios y actualizar la web |
| `ubuntu@vps-bbf37ab0:~/clubPalentino$` | Carpeta de la app en OVH | Ejecutar Git y Docker Compose para esta aplicación |

Aunque la ventana esté en tu ordenador, después de conectar por SSH los comandos se ejecutan en OVH.

## 1. Subir tus cambios a GitHub desde el ordenador

Si Codex ya te ha confirmado que ha hecho el **push**, o ves el último cambio en GitHub, pasa al paso 2.

En PowerShell, abre la carpeta del proyecto y comprueba qué ha cambiado:

```powershell
cd C:\Users\User\Desktop\plataformaAjedrez
git status
git diff
```

Antes de publicar, comprueba la aplicación. Ejecuta cada comando por separado; si uno falla, corrígelo antes de continuar:

```powershell
npm ci
npm run build
npm run test:server
npm test
npm audit --audit-level=high
```

Si las pruebas indican que falta el navegador de Playwright, ejecuta `npx playwright install chromium` y vuelve a ejecutar `npm test`.

Prepara los archivos y revisa lo que vas a subir:

```powershell
git add .
git diff --cached
```

No incluyas contraseñas, claves privadas, bases de datos, copias ni documentos privados de alumnos. El proyecto ya excluye `.env`, `data/`, `backups/` y otros archivos privados mediante `.gitignore`; revisa también cualquier archivo nuevo.

Si la selección es correcta, guarda el cambio y súbelo. Sustituye el mensaje por una descripción breve de lo que has cambiado:

```powershell
git commit -m "Actualizar información de la escuela"
git push origin main
```

Si ya habías hecho el commit, basta con el push. Si Git rechaza el push, conserva el mensaje y resuelve la causa; no uses `--force`.

## 2. Conectar al servidor desde PowerShell

```powershell
& "C:\Program Files\Git\usr\bin\ssh.exe" ubuntu@57.131.196.225
```

Esta ruta usa el SSH de Git instalado en este ordenador. En otro equipo con OpenSSH disponible puedes usar `ssh ubuntu@57.131.196.225`.

Introduce la **contraseña del usuario ubuntu del VPS**, no la de GitHub ni la del administrador de la web. No se muestran letras ni asteriscos mientras la escribes.

Cuando veas `ubuntu@vps-bbf37ab0:~$`, ya estás en OVH. Si perdiste o cerraste la terminal, basta con volver a conectar; la web continúa funcionando.

## 3. Actualizar la aplicación en OVH

El acceso al repositorio privado ya está configurado mediante una clave de despliegue de solo lectura. No hay que crearla de nuevo en cada actualización.

Antes de un cambio importante, especialmente si modifica la base de datos, crea una copia consistente siguiendo el apartado de [copias y recuperación](DESPLIEGUE.md#6-copias-y-recuperación). Guarda una copia protegida fuera del servidor. La snapshot de OVH permite volver a un estado completo anterior, incluyendo los datos de ese momento.

En la **terminal del servidor**, pega este bloque completo:

```bash
cd ~/clubPalentino &&
git pull --ff-only &&
sudo docker compose config --quiet &&
sudo docker compose up -d --build
```

Los `&&` hacen que el bloque se detenga si un paso falla. Si `sudo` pide contraseña, introduce la del VPS. El proceso descarga los cambios, valida la configuración y construye y arranca la nueva versión. Puede tardar varios minutos y producir una breve interrupción mientras se sustituye el contenedor de la app.

La validación de Compose no imprime nada cuando todo está bien. `Already up to date` significa que Git ya tiene la última versión; Docker todavía puede necesitar reconstruirla.

## 4. Comprobar el resultado

En la misma terminal:

```bash
sudo docker compose ps
git log -1 --oneline
```

- `app` debe aparecer como **healthy**. Si pone `health: starting`, espera unos segundos y repite `sudo docker compose ps`.
- `caddy` debe aparecer como **Up** o **Running**.
- El identificador mostrado por Git debe corresponder al cambio que querías publicar. Esto verifica la copia del código; comprueba también el resultado en el navegador.

Abre https://clubpalentinoajedrez.es/ y recarga con **Ctrl + F5**. Comprueba la sección que has modificado. Si has cambiado accesos o permisos, prueba también con el rol correspondiente.

Puedes cerrar la conexión escribiendo:

```bash
exit
```

La web sigue funcionando en el servidor.

## Si también has cambiado Caddyfile

Los cambios del proxy HTTPS necesitan validar la configuración nueva y recrear Caddy para que lea el archivo actualizado. Después de actualizar el código y arrancar los servicios, ejecuta en el VPS:

```bash
sudo docker compose run --rm --no-deps caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile &&
sudo docker compose up -d --no-deps --force-recreate caddy
```

Puede producirse una breve interrupción mientras se reinicia Caddy. Si la validación falla, no fuerces el reinicio: conserva el error para corregir la configuración.

## Si algo falla

| Mensaje o síntoma | Qué hacer |
| --- | --- |
| PowerShell no reconoce `ssh` | Utiliza la ruta completa del paso 2. |
| `Permission denied (publickey)` al descargar de GitHub | Revisa la clave de despliegue del repositorio. La contraseña del VPS no sustituye esa clave. No compartas su archivo privado. |
| Git avisa de cambios locales, conflictos o de que no puede hacer fast-forward | Detente y conserva el mensaje. No borres archivos ni uses `git reset --hard` para saltarlo. |
| La compilación de Docker falla | Conserva el primer error de la compilación. No des por publicada la nueva versión. |
| `app` aparece como `unhealthy`, `Restarting` o `Exited` | Consulta los registros con los comandos de abajo. |
| La web devuelve 502 o no abre | Comprueba el estado y los registros de ambos servicios. |
| La web abre, pero no muestra los cambios | Revisa el último commit, que la construcción haya terminado y que estás en el dominio del club, no en `github.io`. Recarga con Ctrl + F5. |

Para consultar los registros en el VPS:

```bash
cd ~/clubPalentino
sudo docker compose ps
sudo docker compose logs --tail=80 app
sudo docker compose logs --tail=80 caddy
```

Puedes facilitar esos errores para pedir ayuda, ocultando datos personales o credenciales que pudieran aparecer. Revertir una actualización de código requiere revisar su compatibilidad con los datos; no restaures la base de datos automáticamente, porque perderías cambios posteriores a la copia.

## Qué se conserva al actualizar

Los usuarios, contraseñas protegidas mediante hash, noticias, torneos y archivos subidos se guardan en el volumen persistente `club_data`. La actualización ordinaria reconstruye los contenedores y conserva ese volumen.

**No ejecutes `docker compose down -v` ni borres los volúmenes:** eso puede eliminar los datos. Tampoco vuelvas a clonar la app en otra carpeta para actualizar, porque podrías arrancar otro proyecto con una base de datos vacía.

No necesitas volver a configurar el dominio, pagar otro servidor ni reenviar el sitemap a Google después de cada actualización normal.
