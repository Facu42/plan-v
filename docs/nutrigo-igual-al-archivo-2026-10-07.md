# Pantallas de la paciente iguales al archivo de Nutrigo (2026-10-07)

Rama `claude/inspiring-lovelace-nfsot9`. Pedido de Facundo: "No se parece y lo quiero igual", usando
el código que ya sale del archivo de Figma (`OTolnKfsxUFjaZOhhdb04i`), en español, y desarrollando lo
que falte en el backend.

## Qué pasaba

Las diez pantallas de la paciente ya se armaban con el código original de cada frame
(`src/features/nutrigo/source/*.json`), pero los enlaces de datos de cada pantalla vaciaban el diseño:
- ocultaban gráficos;
- cambiaban cifras por "—";
- reemplazaban tarjetas y listas por renglones de texto;
- agregaban botones fuera del marco.

Además, la demo local arrancaba casi sin datos.

## Regla nueva

**Nunca se oculta ni se vacía un bloque del archivo.** Con dato, el mismo bloque muestra el valor real.
Sin dato, muestra el mismo bloque en cero o con un texto corto en español dentro del bloque.

Herramientas comunes en `src/features/nutrigo/screens/shared.tsx`:

| Herramienta | Qué hace |
|---|---|
| `cloneList` / `listChildren` | Repite los ítems originales en ciclo, para conservar sus colores, e intercala las líneas divisorias. |
| `barFill` | Llena una barra con el porcentaje real. |
| `Ring` | Dibuja una dona o media dona con el valor real, en lugar del dibujo de ejemplo. |
| `EmptyState` | Muestra el texto de vacío con la tipografía del archivo. |

Las pruebas de `screens/*-screens.test.tsx` exigen los bloques del archivo, que ningún bloque quede
oculto y que no aparezcan datos de ejemplo en inglés.

## Medición contra Figma

`scripts/nutrigo-compare.mjs` captura las pantallas en modo demo y las compara píxel por píxel contra
los renders 1:1 de los 20 frames, guardados en `design/nutrigo-frames/`. Informe:
`design/nutrigo-compare/informe.md`. La línea de base es `informe-inicial-2026-10-07.md`.

Los datos y textos de Plan V nunca dan 0 %. El indicador más claro es el alto de cada pantalla
contra el del archivo:

| Pantalla (escritorio) | Alto Figma | Antes | Ahora |
|---|---|---|---|
| Agenda | 1048 | 3871 | 1050 |
| Compras | 1412 | 3296 | 1421 |
| Recursos | 1136 | 1871 | 1133 |
| Progreso | 1157 | 1216 | 1157 |
| Diario | 1322 | 1484 | 1328 |

Para repetirlo:

```
npm run local
node --import tsx scripts/nutrigo-compare.mjs --seed
```

La opción `--seed` carga el contenido de ejemplo completo: recetas con nutrientes, meta de calorías,
plan, medidas, rutina con series hechas y pasos.

## Backend nuevo: pasos del día

- **Base:** columna opcional `habit_logs.steps` (0 a 100.000), en `supabase/migrations/20261007120000_habit_steps.sql`.
- **Cómo se registran:** la paciente los declara desde la tarjeta Pasos de Inicio ("Registrar pasos"), igual que el agua y el descanso.
- **Referencia:** Plan V no guarda metas de pasos ni de agua. Las barras usan una referencia general (8.000 pasos y 2 L) y la pantalla la llama «referencia», nunca meta.
- **Dispositivos:** no se importan datos de dispositivos (decisión de alcance vigente).
- **Orden de publicación:** si la web y la API se publican antes de aplicar la migración, guardar agua y descanso sigue funcionando. Solo registrar pasos falla hasta que exista la columna.
- **Estado:** no está aplicada en producción. Necesita la frase escrita de Facundo: «aplicá la migración de pasos en la base».

## Lo que el diseño muestra y Plan V todavía no guarda

Hoy se ve en cero o "Sin dato" dentro de su bloque. Cada punto es una propuesta para decidir:

| Dato | Dónde | Propuesta |
|---|---|---|
| Meta de peso | Inicio y Progreso | Campo opcional que carga la nutricionista. Toca la función que valida la meta (exige 9 datos exactos), así que va aparte y con revisión. |
| Pecho, brazo y muslo | Progreso | Sumar esos tipos a las medidas (`MEASUREMENT_KINDS`). |
| Dificultad, tiempo de cocción, utensilios y puntaje de recetas | Menú | Campos opcionales en la receta. |
| Fibra, sodio, azúcares y otros nutrientes | Detalle de receta y Diario | Ampliar los nutrientes por porción. |
| Peso levantado y calorías por ejercicio | Ejercicio | Campos opcionales en el registro de actividad. |
| Nombre y presentación de la nutricionista | Mensajes | Sumarlos a lo que ve la paciente. |
| Vista previa de imágenes del chat | Mensajes | Dirección de vista previa chica. |
| Precios y gasto de compras | Compras | Fuera de alcance por decisión vigente (`ALCANCE_DECISIONS`). Se muestra "Sin precios". |

## Comprobaciones

- `npm test`: 251 archivos y 1.443 pruebas aprobadas (2 omitidas).
- `npm run check`, `npm run check:migrations` y `npm run build`: sin errores.
- Comparación visual lado a lado de las diez pantallas en 1440 y 390.

## Fuera de este paso

Pantallas de la nutricionista, ingreso y administración (Figma no las dibuja). Van en otra rama, armadas
con piezas del archivo.

## ECC

Se sumaron solo las habilidades y reglas útiles de [ECC](https://github.com/affaan-m/ECC) (ver
`.claude/rules/ecc/README.md`). Las reglas de Plan V mandan.
