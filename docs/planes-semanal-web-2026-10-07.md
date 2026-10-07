# Editor semanal web: primer incremento (2026-10-07)

Facundo indicó comparar con Nutriboost antes de comenzar. Se revisó nuevamente el video público [Nutriboost, gestiona tu consultorio con IA](https://www.loom.com/share/35b428b996314f9c8f5505de4a6297cb), detenido en 164,409 segundos (2:44). [Captura de referencia](evidencia-planes/nutriboost-editor-0244.png). Sólo evidencia visual: Facundo reemplazó la escucha pendiente por lo mostrado en pantalla; no se afirma haber oído el audio.

## Comparación y alcance

| Nutriboost visible | Primer avance en Plan V |
| --- | --- |
| Barra de lunes a domingo | Días fechados del período, siete por grupo, con semana anterior/siguiente; conserva períodos existentes de hasta 22 fechas |
| Comidas agrupadas por momento | Secciones Desayuno, Colación, Almuerzo, Merienda, Cena y Extra |
| Barra del día y análisis lateral, rotulado promedio diario de toda la semana | Panel lateral del día seleccionado, actualizado al editar; promedio semanal pendiente |
| Acción «Copiar día» | Pendiente; no se afirma que esté implementada |
| Exportar PDF y notificar cliente | No se implementaron en este incremento |

Composición profesional propia dentro de la piel existente de Nutrigo: tokens, tipografía y componentes ya leídos del archivo, sin nueva interpretación de sus pantallas de paciente. No se replica la marca/colores de Nutriboost. Preferencias para generar propuestas IA desplegables; el análisis guardado se consulta aparte del análisis en vivo. API de IA existente conservada, sin nuevas generaciones ni proveedor.

## Comportamiento

Cambiar de día conserva todas las indicaciones del borrador; guardar envía todo el período, no sólo el día visible. Los índices originales permiten editar y quitar la indicación correcta. Las fechas fuera del período siguen accesibles y se informa que deben corregirse antes de guardar. Períodos inválidos no producen iteración ilimitada. Agregar desde un momento usa ese día/momento; los botones respetan un registro por día/momento y 42 indicaciones del contrato vigente. Varias recetas/alimentos dentro de una comida requieren una ampliación posterior del contrato; no se simula esa capacidad con registros duplicados.

Análisis de 11 nutrientes con cantidades elegidas y versión congelada de la receta. Recetas IA y propuestas conservan estimación. Un valor cero conocido sigue siendo cero. Si una indicación carece de composición para un nutriente, no hay total completo: se muestra subtotal conocido y cantidad de indicaciones con datos faltantes. Un día vacío no se presenta como ingesta cero. Objetivo y porcentaje sólo cuando hay objetivo guardado; porcentaje requiere total completo y objetivo positivo. Estos porcentajes representan cumplimiento del objetivo profesional, no valores de referencia diarios oficiales. El panel es una vista previa; no cambia el cálculo ni la publicación del servidor.

## Verificación local

- 266 archivos, **1496 pruebas aprobadas y 2 omitidas**. La primera corrida detectó un contrato visual anterior que prohibía incluso nombres de nutrientes; se actualizó para comprobar ausencia de cifras inventadas. Corrida general posterior aprobada.
- Tipos y compilación aprobados; advertencias existentes de Zod/tamaño de paquetes.
- Navegador demo: 0,5 porciones mostraban 19 kcal; al cambiar a 2, actualizó 76 kcal. Crear texto ficticio en desayuno del segundo día, volver al primero, guardar y recargar conserva ambos días, receta v1 y cantidades. No se publicó ningún plan.
- Semana siguiente muestra 14–20/10; reducir período conserva el día 08/10 y muestra aviso; período restituido al guardado 07–13/10. Día vacío y texto sin composición permanecen sin total completo.
- Escritorio 1440×1000 y 1280×800. [1440](evidencia-planes/plan-v-semanal-1440.png), [1280](evidencia-planes/plan-v-semanal-1280.png). Sin desborde horizontal de página en 1280. Panel desplazable y controles con etiquetas; transición respeta movimiento reducido.
- Revisión de código aprobada; revisión de realidad identifica la diferencia entre análisis diario propio y promedio semanal de Nutriboost. Pendientes separados aquí.

Sin migraciones nuevas, despliegue, producción ni servicios pagos. Web solamente; mobile y Academy fuera de alcance. Pendientes del siguiente incremento: promedio semanal y copia explícita de días con protección de contenido existente; después selección directa de alimentos y ampliación de comidas con varios componentes, comparadas previamente con Nutriboost.

## Segundo incremento: copiar días y promedio semanal

Facundo autorizó continuar con ambos apartados. Contraste visual previo nuevo: video detenido en 163,852 segundos, mostrado como 2:44. [Referencia](evidencia-planes/nutriboost-copia-promedio-0244.png): acción «Copiar lunes» con elección de día y análisis del plan rotulado promedio diario de toda la semana. No se observa la confirmación ni la política de reemplazo. Ventana de resumen y destinos protegidos son adaptación propia de Plan V.

Copiar día abre una ventana con origen, indicaciones, versiones, porciones y notas. Permite uno o varios destinos vacíos dentro del período completo. Días con cualquier indicación, incluso pendiente, quedan bloqueados; no sobrescribe ni combina contenido. Confirma cantidad de indicaciones y destinos antes de copiar al borrador. Copia independiente de recetas/propuestas congeladas y sus versiones; el día de origen conserva su contenido. Cancelar/Escape no modifica el borrador. Rechaza destinos repetidos/fuera de período/origen inexistente y la operación completa si supera 42 registros. No guarda ni publica automáticamente. Reemplazar o combinar días existentes no forma parte de esta versión.

Panel Día/Promedio semanal. El promedio diario se calcula sobre los siete días del grupo que contiene el día seleccionado, limitado por las fechas del período; una última semana corta usa sus fechas reales. Fechas fuera de período no aportan al promedio. Cada nutriente se promedia sobre totales diarios completos. Si faltan días completos, muestra «Sin promedio completo» y «Promedio parcial (N de M días)»; no usa un día vacío/incompleto como cero ni mezcla subtotales diarios con totales completos. Conserva estimaciones IA y ceros reales. Cumplimiento del objetivo profesional sólo cuando el promedio está completo y el objetivo es positivo. La fórmula exacta de Nutriboost no queda acreditada por la captura; esta política se explicita en Plan V.

Validación: 266 archivos, **1501 pruebas aprobadas y 2 omitidas**. Tras pulir textos de confirmación/promedio, tipos, compilación y 15 pruebas en 2 archivos aprobados. Advertencias existentes de Zod/tamaño de paquetes. Revisiones de código y realidad sin bloqueos funcionales.

Navegador demo: origen 07/10 con receta v1, 2 porciones; destino 08/10 bloqueado por contenido. Copia al 09/10 guardada y conservada tras recarga; v1 y 2 porciones permanecen. Promedio de energía parcial 76 kcal sobre 2 de 7 días completos, cuatro días sin indicaciones y otro con texto sin composición. Volver a abrir, seleccionar destino 10/10 y Escape conserva ese día vacío. Sin publicación ni petición a IA. [Copia 1440](evidencia-planes/plan-v-copia-1440.png), [1280](evidencia-planes/plan-v-copia-1280.png), [promedio 1440](evidencia-planes/plan-v-promedio-1440.png), [1280](evidencia-planes/plan-v-promedio-1280.png). Sin desborde horizontal de página a 1280; lista y panel desplazables, diálogo reutiliza foco/teclado del componente existente.

Pendientes actualizados: selección directa de alimentos y varias entradas dentro de cada comida; reemplazo/combinar días si se define ese recorrido; visualización más completa por comidas y exportación. Este avance no cierra todo Planes. Se conserva la API de IA existente, sin migraciones nuevas ni producción. Mobile y Academy excluidas.
