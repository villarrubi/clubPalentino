# Dirección visual

Web de un club de ajedrez de Palencia, para alumnado de todas las edades, familias y jugadores. Interfaz editorial y deportiva, cercana, con el escudo original como referencia. Proyecto nuevo; no parte de una plantilla de marca ajena.

- Base clara neutra `#fafaf8`, titulares gris tinta `#253340` y controles azul pizarra `#29465f`. Fondos de apoyo gris suave, sin grandes superficies lavanda. El morado queda en el escudo. La portada y el recorrido narrativo comparten azul profundo `#142f45`, azul pizarra, marfil y acentos arena.
- Tema oscuro azul profundo `#121c27`, con superficies azul grisáceo y acentos desaturados. Inspirado en el tono del cartel de Maristas aportado por el usuario; el contenido de aquella propuesta no forma parte de la oferta de clases.
- Tipografía Outfit para titulares y DM Sans para lectura y controles, alojadas localmente. Georgia en cursiva para las frases editoriales de la portada.
- Iconos Phosphor para controles. Ilustración editorial de portada en crema y azul: torre, alfil y dos peones sobre un tablero, textura suave de papel y el lema «Fuerza y honor» en azul sobre el fondo claro. Sustituye la fotografía morada para integrar la portada con el resto de la interfaz. Libro y estrategia en cursos; las noticias admiten fotos propias elegidas por el administrador. Sin pequeños adornos junto al antetítulo.
- Espaciado amplio en la web pública, más compacto en biblioteca y panel.
- Portada con titular a la izquierda e imagen de ajedrez a la derecha, seguida de un recorrido narrativo Aprende / Juega / Comparte. Noticias con foto o presentación de texto cuando no hay foto, dos cursos, agenda cronológica y contacto directo.
- Variación 6/10, movimiento 5/10 y densidad 4/10. Entradas progresivas al hacer scroll, con escalonado corto en escritorio y recorrido menor en móvil. Imagen de portada con desplazamiento sutil ligado al scroll; sin bucles ni desplazamiento forzado. El icono de tablero del antetítulo se elimina para despejar la portada.
- Radios: controles 5 px y paneles 6-8 px. La imagen de portada tiene esquinas de 8 px.
- Adaptación a móvil en una columna, navegación desplegable en tableta y móvil. Sin desplazamiento horizontal entre 320 y 1440 px en las comprobaciones.
- Contraste y estados de foco, etiquetas semánticas, enlace para saltar al contenido, diálogos nativos y una única secuencia de animación para toda la web.

Taste Skill se consultó como referencia para las superficies públicas. Las instrucciones del club y la utilidad de la interfaz guían las decisiones; el panel se diseña para gestión de documentos. Vercel Web Interface Guidelines se utiliza como referencia de revisión. No se mezclan los estilos completos de otros sistemas o marcas.

Las entradas de sección usan IntersectionObserver y transform/opacity. La portada combina una aparición escalonada del texto (1,5 s) y una entrada de la imagen con un zoom suave (2 s más 0,35 s de demora). Motion mantiene un desplazamiento vertical de hasta 16 px dentro del encuadre al hacer scroll, sin bucles. La imagen se sirve en dos tamaños mediante srcSet y conserva proporción 4:5 en móvil.

Aprende / Juega / Comparte se presenta en tres filas alternas, con libro, trofeo y comunidad en lugar de repetir el caballo. Cada ilustración y bloque de texto entra desde un lado opuesto al alcanzar la ventana: 110 px en escritorio y 48 px en móvil, durante 1,4 s. Cada entrada se reproduce una vez por visita. El foco de teclado revela inmediatamente los enlaces; la impresión muestra todo el contenido.

Por petición del usuario, no hay selector de animaciones ni una preferencia independiente guardada. `data-motion="full"` se establece desde el HTML para coordinar toda la web, también cuando el sistema indica movimiento reducido o quedan preferencias antiguas en el almacenamiento. Las pruebas cubren las entradas laterales, el foco, los enlaces, la ausencia del selector y la nueva apertura.

La portada no incluye invitación de desplazamiento, selector de animaciones ni indicadores del antiguo tablero (notación y barra de progreso). El panel del administrador incorpora Noticias, con vista previa de fotos, edición y borrado.

Escuela, Torneos, Noticias y Contacto comparten entradas escalonadas de títulos (1,15 s) y bloques (1,2 s), además de las transiciones al hacer scroll. MutationObserver incorpora noticias y torneos cargados después del montaje; los observadores se desconectan al cambiar de ruta. El foco de teclado revela el contenido pendiente, mientras que el foco de ratón conserva la posición para evitar desplazar enlaces durante un clic. El aula y los formularios mantienen sus controles estables.
