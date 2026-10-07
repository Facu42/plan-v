# Comparación de Alimentos: Nutriboost y Plan V

7 de octubre de 2026. Facundo rechazó aplicar la propuesta previa sin comparar primero con Nutriboost. No se cambia la interfaz durante esta comparación.

## Evidencia

Demo público: https://www.loom.com/share/35b428b996314f9c8f5505de4a6297cb . Capturas del reproductor revisadas alrededor de 5:52 y 6:06. Son pantallas del video, no una sesión propia con acceso al catálogo. Subtítulos y controles del reproductor ocultan parcialmente algunas zonas. No se afirma escucha directa del audio ni funcionamiento de los controles que sólo aparecen en la grabación.

- [Lista de Nutriboost](evidencia-alimentos/nutriboost-lista.png).
- [Detalle de Nutriboost](evidencia-alimentos/nutriboost-detalle.png).
- [Lista actual de Plan V](evidencia-alimentos/plan-v-lista.png).

## Diferencias comprobadas

| Elemento | Nutriboost en la grabación | Plan V anterior al ajuste |
|---|---|---|
| Distribución | Contenido centrado con márgenes laterales; lista en tabla compacta | Franja vacía amplia a la izquierda y tarjetas grandes |
| Contexto de paciente | No hay selector de paciente en Alimentos | Selector y accesos Pacientes/Ficha/Plan sobre el catálogo |
| Resumen | Cuatro tarjetas: total, propios, plataforma y suplementos | Tres: total, propios y suplementos |
| Tipos | Pestañas Alimentos y Suplementos con cantidades | Selector Tipo |
| Herramientas | Base de datos, búsqueda, orden, Filtros y Columnas | Búsqueda, tipo y origen |
| Filas | Nombre, etiquetas de base/categoría y nutrientes en columnas; Mostrar más | Una tarjeta por alimento con fuente y nutrientes |
| Detalle | Ventana sobre la lista, con cerrar | Panel lateral junto a las tarjetas |
| Composición | Selector de base, macros y tabla de micronutrientes con % de valor diario | Una fuente declarada por alimento, once nutrientes; sin %VD |
| Medidas | Medidas caseras y sección de medidas personalizadas en el detalle | Equivalencias propias en gramos y calculadora de porción |

## Propuesta para discutir

Adoptar la organización de la referencia: tabla compacta, cuatro indicadores, pestañas Alimentos/Suplementos, búsqueda y herramientas en una fila, detalle en ventana y catálogo centrado con márgenes moderados. Mantener colores, tipografía y lenguaje de Plan V. No copiar cifras ni aparentar bases externas cargadas.

La propuesta anterior de ocupar todo el ancho queda reemplazada por esta alternativa de contenido centrado basada en la referencia. Facundo la aprobó después de revisar la comparación; ya se aplicó y se verificó localmente. La decisión aprobada incluye quitar el selector de paciente únicamente de Alimentos.

Filtros, orden y columnas deben funcionar; cada opción de base requiere datos autorizados y trazables. Los %VD requieren referencias verificadas antes de calcularlos. La fuente declarada, los nutrientes desconocidos y las medidas registradas deben conservarse en cualquier cambio de presentación.
## Resultado acordado

Implementación y comprobaciones: [registro de desarrollo](dashboard-nutricionista-web-2026-10-07.md). La tabla anterior documenta la comparación previa; las capturas finales muestran el ajuste aprobado.
