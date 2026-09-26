# Próxima dirección visual: una partida empieza aquí

Investigación solicitada el 26 de septiembre de 2026. Esta es una propuesta para una siguiente iteración; la secuencia narrativa descrita aquí todavía no está implementada.

## Referencias revisadas

- [Motion Primitives — Text Effect](https://motion-primitives.com/docs/text-effect): animación por palabras o líneas. Aplicable a un titular breve, manteniendo su lectura y evitando repetir el efecto durante toda la visita.
- [Motion Primitives — Animated Group](https://motion-primitives.com/docs/animated-group): coordinación de entradas. Aplicable a la presentación de contenidos relacionados.
- [Motion — scroll](https://motion.dev/docs/react-scroll-animations): separación entre animaciones que se disparan al entrar en pantalla y animaciones cuyo progreso depende del desplazamiento. La segunda es adecuada para una pequeña secuencia de ajedrez.
- [Refero Styles — Steep](https://styles.refero.design/style/75fdb89f-ca64-41b3-af36-7a78bd09448e): composición editorial, titulares con personalidad y elementos a distintas alturas. Interesa la jerarquía y la composición, adaptadas al azul del club.
- [Refero Styles — teenage engineering](https://styles.refero.design/style/aecf9dda-5cba-4dc7-9e73-59b65d895cdf): protagonismo del objeto y contraste entre grandes superficies claras y oscuras. Interesa el encuadre de las piezas; no se propone importar su tipografía fina y pequeña.
- [Refero Styles — Cursor](https://styles.refero.design/style/4e3b4717-84c8-4599-baaf-a343c3d619b6): fondos cálidos y tratamiento editorial. Referencia secundaria de superficies y ritmo.

## Concepto recomendado

La portada presenta al club mediante tres momentos: **Aprende, Juega, Comparte**. Un caballo recorre tres posiciones legales (a1 → b3 → d4) en un tablero ilustrado, coordinado con el scroll y los mensajes. Una composición propia que conecta la animación con el ajedrez.

- Portada más abierta, con título de mayor personalidad y una pieza protagonista fuera del encuadre rectangular convencional.
- Una única secuencia breve de tablero, con lectura directa de los tres mensajes y enlaces a la escuela, torneos y contacto. En escritorio se puede mantener la ilustración a la vista durante esos tres momentos; en móvil, composición compacta y recorrido normal.
- Marfil y azul tinta como base; una sección azul profundo para cambiar el ritmo, con el morado del escudo como identidad puntual.
- Noticias con jerarquía de revista, alternando tamaños y posiciones cuando exista más contenido. Sin inventar noticias, cifras ni torneos.
- Movimiento coordinado entre pieza y texto; el resto de la interfaz conserva transiciones sencillas. Controles estables, foco visible y alternativa estática con movimiento reducido.

## Base implementada en esta revisión

Eliminación del pequeño icono de tablero del antetítulo. Entradas al hacer scroll, profundidad en la fotografía, tablero y caballo de noticias; pequeños movimientos de los iconos al pasar el puntero. Implementación nativa, sin instalar Motion ni copiar componentes de terceros. Comprobada en escritorio y móvil, con teclado y movimiento reducido.
