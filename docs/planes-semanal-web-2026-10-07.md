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
