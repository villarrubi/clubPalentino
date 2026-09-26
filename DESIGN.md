# Dirección visual

Web de un club de ajedrez de Palencia, para alumnado de todas las edades, familias y jugadores. Interfaz editorial y deportiva, cercana, con el escudo original como referencia. Proyecto nuevo; no parte de una plantilla de marca ajena.

- Base clara neutra `#fafaf8`, titulares gris tinta `#253340` y controles azul pizarra `#29465f`. Fondos de apoyo gris suave, sin grandes superficies lavanda. El morado queda en el escudo y pequeños detalles de identidad. El recorrido narrativo usa azul profundo `#142f45`, marfil y casillas de acento arena.
- Tema oscuro azul profundo `#121c27`, con superficies azul grisáceo y acentos desaturados. Inspirado en el tono del cartel de Maristas aportado por el usuario; el contenido de aquella propuesta no forma parte de la oferta de clases.
- Tipografía Outfit para titulares y DM Sans para lectura y controles, alojadas localmente. Georgia en cursiva para las frases editoriales de la portada.
- Iconos Phosphor para controles. Pieza de caballo original en SVG, con volumen y base de pieza de ajedrez; sustituye los iconos de cabeza de caballo. Sin pequeños adornos junto al antetítulo.
- Espaciado amplio en la web pública, más compacto en biblioteca y panel.
- Portada abierta con una pieza sobre un tablero en perspectiva, seguida de un recorrido narrativo Aprende / Juega / Comparte. Noticias editoriales, dos cursos, agenda cronológica y contacto directo.
- Variación 6/10, movimiento 5/10 y densidad 4/10. Entradas progresivas al hacer scroll, con escalonado corto en escritorio y recorrido menor en móvil. Pieza y tablero de portada con profundidad ligada al desplazamiento; sin bucles ni desplazamiento forzado. El icono de tablero del antetítulo se elimina para despejar la portada.
- Radios: controles 5 px y paneles 6-8 px. La pieza de portada no está encerrada en una tarjeta.
- Adaptación a móvil en una columna, navegación desplegable en tableta y móvil. Sin desplazamiento horizontal entre 320 y 1440 px en las comprobaciones.
- Contraste y estados de foco, etiquetas semánticas, enlace para saltar al contenido, diálogos nativos y preferencia de movimiento reducido.

Taste Skill se consultó como referencia para las superficies públicas. Las instrucciones del club y la utilidad de la interfaz guían las decisiones; el panel se diseña para gestión de documentos. Vercel Web Interface Guidelines se utiliza como referencia de revisión. No se mezclan los estilos completos de otros sistemas o marcas.

El movimiento usa IntersectionObserver y transform/opacity, sin dependencias adicionales ni listeners por cada paso de scroll. Cada entrada se reproduce una vez por visita a la página. El contenido inicial permanece visible; el foco de teclado revela inmediatamente los enlaces. Se limpian los observadores al navegar y se respeta la preferencia de movimiento reducido, incluso si cambia durante la visita. La impresión muestra todo el contenido.

La profundidad utiliza [CSS animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline), con líneas de tiempo asociadas al encuadre para evitar que el movimiento de la pieza altere su propio progreso. Es una mejora progresiva: los navegadores sin soporte conservan las entradas de sección y las ilustraciones estáticas.

El recorrido usa un tablero SVG de 64 casillas con a1 oscura. La posición cambia a1 → b3 → d4 al llegar a cada capítulo, y vuelve hacia atrás al invertir el scroll. Son dos saltos legales de caballo. El observador usa una línea de lectura basada en la altura de la ventana y se recalcula al redimensionar. El tablero permanece visible junto al texto en escritorio; en móvil se reduce y se coloca encima de los capítulos. Con movimiento reducido se muestra estático, sin fijación ni esperas de lectura. Los tres enlaces siempre están disponibles.
