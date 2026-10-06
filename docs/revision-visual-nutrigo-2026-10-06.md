# Revisión de coherencia visual de paciente y consultorio

Revisión iniciada el 5 de octubre y cerrada el 6 de octubre de 2026. Rama `codex/visual-consistencia`, sobre `codex/paciente-nutrigo`. Entorno local de demostración, con registros ficticios; producción no se modificó.

## Resultado

Se corrigieron diferencias en colores de formularios y diálogos, identificación de pantallas, espacio del consultorio y acceso al contenido en móvil. Las pantallas del paciente conservan las fuentes exportadas de Nutrigo; no se modificaron los 24 árboles originales, sus clases ni sus imágenes. El consultorio y las superficies adicionales usan el mismo sistema visual, adaptado a sus tareas.

Esto acredita coherencia de los estados examinados. No acredita igualdad de cada píxel ni la revisión de todas las combinaciones de contenido, permisos o estados.

## Fuente y valores

Referencia: Figma `OTolnKfsxUFjaZOhhdb04i`; inventario y exportaciones guardadas en `design/figma-reference/manifest.json`, obtenidas el 1 de octubre. Durante esta revisión se consultaron nuevamente los nodos de navegación `12:793`, cabecera `33:1574` y tarjeta `78:782` mediante el contexto de diseño de Figma.

| Elemento | Valor utilizado de Nutrigo |
| --- | --- |
| Familia tipográfica | Poppins, regular, medium, semibold y bold |
| Fondo general | `#F9F4F2` |
| Tarjetas | `#FFFFFF`, variante `#FEFCFB` |
| Texto principal y secundario | `#272932`, `#52545B`, `#8A8C90` |
| Líneas | `#E1E1E2` |
| Verde activo | `#C2E66E`, variante suave `#DFF9A2` |
| Colores de categorías | `#FFCB65` y `#FFA257` |
| Navegación lateral del paciente | 223 px; elemento activo con radio 14 px |
| Cabecera de escritorio | 50 px; título 22 px, peso 600, interlineado 1,08 |
| Tarjeta estadística de referencia | 197 × 142 px, relleno 16 px, radio 16 px |

Los formularios de Pagos, Mi ficha y los diálogos no tienen una composición propia en Nutrigo. Se resolvieron con tarjetas blancas, relleno de 16 px, radios de 16 px, fondo crema y controles verdes del mismo sistema. El rojo de acciones destructivas conserva su significado. El consultorio usa el ancho disponible y cabecera propia; no replica la columna de widgets del paciente.

## Problemas corregidos

| Problema observado | Corrección |
| --- | --- |
| Formularios y diálogos fuera del contenedor que define los colores; bordes y fondos anulados por el reset | Se extendieron los colores al contexto correspondiente y se redujo la prioridad del reset para respetar los controles y las clases fuente. |
| Pagos y Mi ficha aparecían con título de Plan y controles de un mes ajeno | Títulos propios, retiro de controles de período y Plan sin selección activa, conservando el enlace. |
| Permisos de IA separados de Mi ficha; barras posteriores agregaban una pantalla vacía de altura | Permisos dentro de la ficha; las barras de estado y cambio de rol ocupan su altura real. |
| Inicio profesional reservaba una columna vacía para widgets del paciente | Espacio de trabajo en una columna. Cabecera de cuenta situada arriba, sin superponerse al selector de paciente. |
| Registro de comidas conservaba tipografía y colores anteriores | Diálogo integrado a Poppins y la paleta Nutrigo, incluidas pestañas, fondo y controles. |
| Foto o error podían dejar el botón del diálogo fuera de alcance en móviles bajos | Altura máxima según la ventana y desplazamiento interno. Comprobado con archivo inválido y error real. |
| Detalle de receta abría en la posición de desplazamiento del menú | Al abrir el detalle vuelve al inicio. Etiqueta de evaluación abreviada para caber en la columna móvil; singular correcto de pasos. |
| Encabezado de recurso en escritorio aparecía como un guion | Se reconoce también el título singular de la fuente y se muestra «Detalle del recurso». |

## Comprobaciones

- 46 vistas: las doce superficies fuente del paciente, Pagos y Mi ficha, y nueve destinos del consultorio, cada una a 1440 y 390 px. Inspección de capturas y medidas del navegador con gstack. Sin desbordamiento horizontal de la página ni imágenes rotas en esos estados.
- 10.628 comprobaciones de estilos efectivos de las 24 variantes fuente: color, tamaño tipográfico, radios, relleno y separación declarados por las clases exportadas. Ninguna discrepancia en esos atributos. No mide todas las posiciones y excluye los estilos explícitos usados para datos dinámicos.
- Diálogo de comida a 390 × 650 con error de archivo: 618 px de altura visible, 863 px de contenido y desplazamiento interno. El botón queda accesible al desplazar.
- Inicio y Plan del paciente e Inicio del consultorio comprobados también a 480, 800 y 1024 px: nueve lecturas sin desbordamiento de página ni imágenes rotas. Se conserva el desplazamiento interno cuando una composición fuente lo necesita; no se desarrolló una variante de tablet.
- Títulos y navegación de las superficies adicionales comprobados mediante tres pruebas; título del detalle de recurso añadido a la prueba existente de ambas variantes.
- Suite general: 244 archivos, 1.391 pruebas aprobadas y dos omitidas. Tipos y compilación aprobados; advertencias previas de tamaño de archivos compilados y anotaciones de dependencias.
- Revisión independiente de código y de evidencia visual; el problema de desplazamiento del diálogo identificado en esa revisión se corrigió y se comprobó en navegador.

Evidencia local en `.gstack/visual-review/`: `metrics.json`, `source-style-checks.json`, `detail-style-checks.json`, `intermediate-checks.json`, `tests-final.log`, `check-final.log`, `build-final.log` y capturas de cada destino. La hoja del consultorio móvil se regeneró con Inicio real en lugar de la antigua captura de ingreso.

## Alcance y límites

El contenido proviene del servidor local; una receta ficticia publicada y asignada permitió examinar el detalle. La falta de foto, nutrientes, valoraciones o metas se representa con espacios y estados sin datos. No se trasladaron las cifras ni las fotos de ejemplo de Figma a datos de pacientes.

No se modificaron API, contratos, migraciones ni configuración de producción. Esta revisión visual no reemplaza la evidencia previa de permisos y persistencia autenticada documentada en la entrega del consultorio. El bloqueo previo del control de dependencias por `source-map-js` sigue separado de estas correcciones; no se presenta la publicación como habilitada.

Las exportaciones se reutilizan como fuente de implementación; no hay sincronización automática con futuras ediciones de Figma. Quedan fuera de una afirmación de igualdad total las variantes no inspeccionadas, los cambios posteriores del archivo y la comparación de cada píxel de las 24 pantallas.
