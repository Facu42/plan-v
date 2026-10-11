# Plan V · reglas permanentes para Claude Code

Empezá por `AGENTS.md`, `docs/traspaso-estado-proyecto.md` y `docs/agentes/reglas-plan-v.md`.
Este archivo suma las reglas de diseño que pidió Facundo el 2026-10-09; no reemplaza a las otras.
Respuestas a Facundo en español simple, sin jerga ni nombres de variables.

## Diseño: Nutrigo es la fuente de verdad visual

Archivo de Figma: `OTolnKfsxUFjaZOhhdb04i` (Nutrigo). Página "Interface", frames por id de nodo.
Escritorio 1440 y celular 390; tablet no se desarrolla por ahora.

1. **Figma Nutrigo es la única fuente de verdad visual.** No reinterpretar, modernizar ni modificar su diseño.
2. **Plan V es la fuente de verdad funcional.** Conservar backend, API, base de datos, autenticación,
   reglas de negocio y funciones existentes.
3. **Antes de tocar una pantalla, leerla del archivo** con el MCP de Figma (`get_design_context`, cargando antes
   la habilidad `figma-design-to-code`): nodos, componentes, estilos, medidas y recursos. Nunca medidas a ojo
   ni de capturas. El código de cada frame ya está en `src/features/nutrigo/source/*.json` y **se usa tal cual**:
   solo se le enlazan datos y textos en español (`FramePair`, `screens/*.tsx`, `translation.ts`).
4. **Respetar exactamente** tipografía (Poppins), colores, tamaños, espacios, íconos, bordes, sombras,
   navegación y comportamiento en celular. Las variables del archivo están en `design/nutrigo-fidelity.md`.
5. **Todo en español con voseo**, con las traducciones centralizadas en `src/features/nutrigo/translation.ts`
   y `secondaryTranslation.ts`, sin cambiar el diseño.
6. **Componentes reutilizables sobre el sistema real de Nutrigo**: piezas nuevas se arman con nodos del archivo
   (por ejemplo su «Menu Nav» o su tarjeta amarilla) y sus variables, no con estilos propios.
7. **No usar íconos, imágenes ni componentes alternativos** cuando existe el original del archivo.
8. **No reemplazar componentes funcionales de Plan V** sin necesidad.
9. **Comparar cada pantalla contra Figma en el mismo tamaño**: `npm run local` y
   `node --import tsx scripts/nutrigo-compare.mjs [pantalla]` (referencias en `design/nutrigo-frames/`,
   informe en `design/nutrigo-compare/informe.md`). Mirar la imagen lado a lado, no solo el porcentaje.
10. **Corregir las diferencias** antes de dar una pantalla por terminada.
11. **No afirmar que una pantalla coincide** sin esa comparación como evidencia (porcentaje e imagen).
12. **Si función y diseño chocan**, se preserva la función y se consulta antes de cambiar el diseño.
    Lo que el archivo no dibuja (pantallas de entrada, cuenta sin vincular, Pagos, Ficha) se arma con
    piezas del archivo y se dice qué default se eligió. Si Plan V se aparta de algo que el archivo sí
    dibuja, gana el archivo sin volver a preguntar.

Nunca se oculta ni se vacía un bloque del archivo: sin dato, el mismo bloque muestra cero o un texto corto
en español (`docs/nutrigo-igual-al-archivo-2026-10-07.md`).

## Cómo trabajar

- Una rama y un PR por tema. Nada directo a `main`: cada merge publica la web y la API para usuarios reales.
  Se junta solo con el "publicalo" o "juntalo al main" de Facundo.
- Nada en la base de producción ni en servicios pagos sin su frase escrita.
- Antes del PR: `npm test`, `npm run check` y, si hay migraciones, `npm run check:migrations`.
- Para que Facundo lo vea: la página andando o la comparación como Artifact del proyecto
  (las vistas previas de Vercel le piden login). En producción no hay modo demo.
- Mantener al día `docs/traspaso-estado-proyecto.md`.
