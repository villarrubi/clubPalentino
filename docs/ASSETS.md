# Recursos gráficos y fuentes

- `public/images/logo-palentino.jpg`: original facilitado por el usuario. Se conserva el archivo, con recorte circular únicamente en CSS para ocultar las esquinas negras.
- `public/images/ajedrez-hero.webp`: recurso conservado de la portada anterior, actualmente sin uso. Imagen original generada con la herramienta integrada ImageGen. Se revisó visualmente y se convirtió a WebP de 1120 × 1400 para reducir su peso, sin cambiar la composición. `ajedrez-hero-mobile.webp` es la variante de 800 × 1000 preparada para pantallas pequeñas en aquella versión. No es una fotografía documental del club.
- Iconos: paquete `@phosphor-icons/react` (MIT).
- Fuentes: paquetes Fontsource de Outfit y DM Sans (licencias incluidas en sus distribuciones). Archivos alojados con la web; sin peticiones a Google Fonts.
- `src/ChessKnight.tsx`: carga `public/images/caballo-clasico.svg`, una copia local sin modificar de [Chess nlt45.svg de Cburnett](https://commons.wikimedia.org/wiki/File:Chess_nlt45.svg), exclusiva de la portada. Licencia elegida: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). La atribución y el historial de ajustes se incluyen en `public/images/caballo-creditos.txt`, enlazado desde el pie. Sustituye el caballo dibujado en código. `src/ChessJourney.tsx` y `src/journey.css`: composición y animación de portada y bloques Aprende / Juega / Comparte. Los cursos utilizan iconos Phosphor distintos en lugar del caballo. Las noticias muestran las fotos elegidas por el administrador; sin foto, utilizan una presentación de texto.

## Prompt de la portada anterior (herramienta integrada)

Use case: stylized-concept. Asset type: hero image for Club Palentino de Ajedrez, a Spanish chess club website with purple (#522994) and ivory identity. Create a premium editorial still-life photograph of a beautifully carved ivory Staunton knight as the tall central focal point, an ivory pawn at foreground right and a deep royal-purple rook behind left, on a real alternating ivory and muted purple chessboard with correct straight square grid seen in perspective. Purple seamless studio background and warm daylight from upper left, beautiful long soft cast shadows, tactile matte ceramic finish, fine subtle film grain, architectural sophisticated composition. Medium close up, 4:5 portrait composition, leave comfortable negative space at upper edge. Physical chess pieces must be recognizable, realistic and sculptural; avoid extra limbs or deformed horse head. Restrained palette, true photographic product quality. No text, no logos, no watermark, no UI, no border.

## Caballo Staunton anterior (conservado, sin uso)

Generado mediante la herramienta integrada ImageGen, conservando transparencia real (canal alfa). Sustituido por una nueva ilustración SVG a petición del usuario. Se conserva como recurso histórico; no aparece en la web.

- `public/images/caballo-staunton.webp`: 800 × 1000, 120326 bytes, sin uso actual.
- `public/images/caballo-staunton-small.webp`: 144 × 180, 8764 bytes, sin uso actual.
- Original: `C:/Users/User/.codex/generated_images/01a0df64-8629-7ab0-9a63-17501f4be044/exec-a346aaf2-1605-4efd-8e7b-02d1e4a6caae.png` (1122 × 1402, RGBA). Conversión y reducción de tamaño con Sharp, sin alterar la composición ni sustituir el fondo transparente.

Prompt final:

> Use case: product-mockup. Asset type: transparent isolated chess piece for a refined chess club website, NOT a website mockup. Create one single photorealistic ivory Staunton knight chess piece, exquisite traditional wooden tournament set craftsmanship. Recognizable elegant carved horse head facing left in a subtle three-quarter view, graceful curved neck, carefully carved mane with fine incisions, restrained anatomical detail, round turned pedestal base in one solid continuous piece. Warm pale boxwood/ivory material with delicate realistic grain and satin polish. Luxury studio product photography, large softbox from upper left, realistic shading and fine edge definition. Entire piece visible, centered, almost fills a portrait 4:5 canvas with small even breathing room. GENUINE TRANSPARENT ALPHA BACKGROUND; no chessboard, no floor, no cast shadow outside the piece, no backdrop, no text, no logo. The output must look like an actual photographed premium Staunton chess piece. Avoid cartoons, line drawings, vector appearance, angular polygonal faces, triangular eyes, crown-like ears, separate floating pedestal layers, gold metallic finish. Deliver a clean isolated photographic cutout with transparent background.
