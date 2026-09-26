# Dirección visual

Web de un club de ajedrez de Palencia, para alumnado de todas las edades, familias y jugadores. Interfaz editorial y deportiva, cercana, con el escudo original como referencia. Proyecto nuevo; no parte de una plantilla de marca ajena.

- Base clara neutra `#fafaf8`, titulares gris tinta `#253340` y controles azul pizarra `#29465f`. Fondos de apoyo gris suave, sin grandes superficies lavanda. El morado queda en el escudo, la fotografía y pequeños detalles de identidad.
- Tema oscuro azul profundo `#121c27`, con superficies azul grisáceo y acentos desaturados. Inspirado en el tono del cartel de Maristas aportado por el usuario; el contenido de aquella propuesta no forma parte de la oferta de clases.
- Tipografía Outfit para titulares y DM Sans para lectura y controles, alojadas localmente.
- Iconos Phosphor. Fotografías generadas y motivos de tablero solo donde aportan contexto.
- Espaciado amplio en la web pública, más compacto en biblioteca y panel.
- Composición partida en portada, noticias editoriales, dos cursos, agenda cronológica y contacto directo.
- Variación 6/10, movimiento 5/10 y densidad 4/10. Entradas progresivas al hacer scroll, con escalonado corto en escritorio y recorrido menor en móvil. Fotografía y piezas con profundidad ligada al desplazamiento; sin bucles ni desplazamiento forzado. El icono de tablero del antetítulo se elimina para despejar la portada.
- Radios: controles 5 px, paneles 6-8 px, curva asimétrica solo para el encuadre de portada.
- Adaptación a móvil en una columna, navegación desplegable en tableta y móvil. Sin desplazamiento horizontal entre 320 y 1440 px en las comprobaciones.
- Contraste y estados de foco, etiquetas semánticas, enlace para saltar al contenido, diálogos nativos y preferencia de movimiento reducido.

Taste Skill se consultó como referencia para las superficies públicas. Las instrucciones del club y la utilidad de la interfaz guían las decisiones; el panel se diseña para gestión de documentos. Vercel Web Interface Guidelines se utiliza como referencia de revisión. No se mezclan los estilos completos de otros sistemas o marcas.

El movimiento usa IntersectionObserver y transform/opacity, sin dependencias adicionales ni listeners por cada paso de scroll. Cada entrada se reproduce una vez por visita a la página. El contenido inicial permanece visible; el foco de teclado revela inmediatamente los enlaces. Se limpian los observadores al navegar y se respeta la preferencia de movimiento reducido, incluso si cambia durante la visita. La impresión muestra todo el contenido.

La profundidad utiliza [CSS animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline), con líneas de tiempo asociadas al encuadre para evitar que el movimiento de la pieza altere su propio progreso. Es una mejora progresiva: los navegadores sin soporte conservan las entradas de sección y las imágenes estáticas.
