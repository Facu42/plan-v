# Auditoría: ¿cada pantalla usa el código original del archivo y se adapta a los datos? (2026-10-07)

Pedido de Facundo: asegurar que **todo el proyecto toma el código de Figma tal cual** y que ese código se
adapta a la carga de datos y a su variabilidad. Regla vigente (`docs/agentes/reglas-plan-v.md`, regla 2): el
código de cada frame (`src/features/nutrigo/source/*.json`, leído con `get_design_context`) se usa tal cual; solo se
le enlazan datos y textos en español. Las capturas no se usan para desarrollar.

## Cómo se hizo

Tres revisiones en paralelo, una por grupo de pantallas, más lo común (`shared.tsx`, `FramePair`, menú). En cada una:
1. **Inventario:** todo lugar donde el enlace de datos reemplaza o descarta código original (JSX propio, `hidden`,
   dibujos propios, íconos propios, estilos en línea que pisan clases del archivo, bloques fuera del marco).
2. **Variabilidad:** sin dato, 0, uno, muchos, textos largos, NaN/infinito, negativos, decimales, zona horaria
   (Argentina), listas vacías, fotos ausentes o inseguras.
3. **ECC:** prueba primero (que falle), código mínimo, suite completa en verde y revisión con el agente `code-reviewer`.

## Medidores de Inicio (hechos con el código de Figma)

Se leyeron los nodos `57:1509` (Weight Data) y `62:1513` (Calories Intake). El archivo dibuja cada arco para **un solo valor**
(78 kg, 1240 kcal). Para adaptarlo al dato sin redibujar:
- **Peso:** la silueta del medio anillo son las dos piezas SVG originales (`f641d.svg` y `16730.svg`) en su mismo lugar y medidas,
  usadas como máscara; el color se reparte según el avance y el rayado son las líneas blancas del archivo (`35603.svg`).
- **Calorías:** quedan el círculo gris, el anillo amarillo y el orden de capas originales; el arco naranja es el SVG original
  (`1af77.svg`), recortado en el ángulo exacto y repetido girado cuando el valor pasa de lo que dibuja el archivo.
- Medidas en `screens/arc-geometry.ts` (con pruebas) y piezas en `screens/arcs.tsx`.

## Resultado por pantalla

| Pantalla | Se conserva el código original | Lo que se corrigió |
|---|---|---|
| Inicio | Tarjetas Peso/Pasos/Descanso/Hidratación, listas de menú, ejercicio, plan y actividad | Barras de macros que nunca se dibujaban; rótulos que se salían de la tarjeta; tilde de comida registrada; litros con 2 decimales; semana y mes con día argentino; recarga sin dejar datos en blanco |
| Progreso | Filas de la tabla, tarjetas de fotos, columnas de hábitos | Peso inválido tratado como sin dato; celdas vacías «—» |
| Agenda | Calendario, tarjetas (íconos del archivo), detalle | Solo citas; abre en la próxima cita |
| Mensajes | Burbujas, separadores, perfil, íconos de cabecera | Fecha inválida ya no tira la pantalla; «99+»; adjuntos solo https; etiquetas únicas; hora argentina |
| Diario | Tarjetas, filas de la tabla, paginación | Nutrientes inválidos («—», abreviación de enormes); orden por instante real; nombre largo |
| Compras | Tarjetas, filas, donut y resumen | Cantidades con 2 decimales; nombre recortado; mes en Argentina |
| Menú y receta | Cards, fichas de nutrientes, pasos, reseñas | Foto del plato solo si hay foto lista y segura (si no, el gris del archivo); pasos ya no se esconden; porciones 1,25; nombres largos con elipsis |
| Plan | Tabla semanal | Fila que crece con textos largos; comida sin nombre |
| Ejercicio | Tabla, estados, paginación | «0 de 0»; en celular se ven todas las filas (antes quedaban inalcanzables) |
| Recursos | Tarjetas, filtros, detalle | Filtro activo sin doble fondo; textos largos; foto ausente |
| Común | Barra lateral, perfil, banner, menú del celular | Nombre largo con puntos suspensivos; globo de mensajes «99+»; `percent`/`dateId` robustos; horas y fechas en Argentina |

## Decisiones de Facundo (2026-10-07)

1. **No agregar** la nota «estimaciones de IA» fuera del marco: se quitó de Inicio. (Siguen los avisos de carga y de error, que son necesarios para que una falla no pase inadvertida.)
2. **Sí** a los diálogos armados con piezas y tokens del archivo (Registrar comida, Registrar/Filtrar del Diario, Agregar producto, Opciones del plan, formularios de Ejercicio).
3. **Sí** a la estrella del archivo como favorita en el detalle de receta.
4. **Sí** al «×» de borrar en Compras y a los íconos de series/repeticiones.
5. **Sí** a Actividad reciente clonando el primer ítem del archivo.
6. **Sí** a que los adjuntos del chat usen las filas originales: documentos con «Item List Docs» (`209:5633`) e imágenes con el tile «Media N» (`210:6186`). Hecho en `screens/message-attachments.tsx`.
7. **Sí** a la leyenda de Descanso en Progreso.
8. **Sí** a Ejercicio en celular mostrando todas las filas.

## Qué no se pudo verificar

Todo se probó con la demo local y con datos modificados desde el navegador; no con el servidor real ni con producción.
Fotos de platos generadas por IA solo con una imagen mínima. Los diálogos propios no se revisaron con datos extremos.
