# Figma y accesos del consultorio

Fecha: 2026-10-01. Rama: `codex/figma-crm-funcional`.
Trabajo preparado para integrar mediante PR; producción sigue en su versión anterior.
No se aplicaron migraciones, cambios de configuración ni servicios nuevos.

## Fuente y alcance

Se usó el MCP de Figma para obtener código y captura de doce pantallas de Nutrigo
y sus doce versiones móviles. El [inventario de los 24 nodos](../design/figma-reference/manifest.json)
registra las huellas del código recibido y de los 19 SVG originales usados en la app.
La [nota de adaptación](../design/figma-reference/README.md) explica las medidas y los
estados que Figma no dibuja. La referencia completa queda localmente en
`.gstack/figma-reference`; no se incorporan URLs temporales a la aplicación.

Se conservaron los componentes existentes de Agenda, Menú, Plan, Compras, Diario,
Progreso y Recursos, ajustando su piel común. Se recompusieron Inicio y Ejercicio;
se corrigieron fondos, placeholders y tarjetas del detalle de recurso y receta.
Los textos siguen en español y la identidad es Plan V.

## Cambios funcionales

- El menú profesional empieza por Inicio, Pacientes, Fichas y Planes.
- En todas las pantallas profesionales hay accesos visibles a Pacientes, Ficha y Plan,
  junto con un selector de paciente. Cada fila del directorio permite abrir directamente
  la ficha o el plan de esa persona; seguimiento, edición y archivo siguen disponibles.
- La selección se conserva al navegar y recargar mediante la URL. Un paciente que
  no existe o está archivado muestra «Paciente no disponible», con acciones deshabilitadas;
  no se abre por defecto la ficha de otra persona.
- Cambiar de paciente desmonta los datos y formularios anteriores. Las respuestas
  pendientes se abortan. Guardar los datos corporales actualiza el peso de Inicio.
- Buscar desde Inicio paciente conserva el término al abrir el Plan.
- El detalle de recurso conserva la ruta del consultorio y la selección. El enlace
  para compartir no incluye el identificador del paciente.
- El menú móvil cerrado queda fuera de la navegación por teclado. Escape lo cierra
  y devuelve el foco al botón. Avisos y opciones de cuenta siguen en el cajón móvil.

## Cambios visuales y estados

Inicio recupera Peso, Pasos, Descanso e Hidratación; media dona de peso, registro
nutricional, seguimiento, plan del día y ejercicios asignados. Se usan datos de la API;
pasos y metas de peso no disponibles permanecen vacíos. La silueta de peso es el SVG
del MCP de Figma en gris, sin simular progreso hacia una meta.

Ejercicio usa una tabla de siete columnas, búsqueda, filtro de estado y paginación.
La biblioteca, asignación y feedback siguen disponibles en un apartado desplegable.
Los errores de carga se muestran junto a la tabla, sin confundirse con falta de datos.
Se conservan los permisos de habilitación profesional del servidor.

Se quitaron fotos de comidas elegidas arbitrariamente y el dibujo de plato que Figma
no contiene. La ausencia de foto usa un bloque gris; las fotos reales siguen visibles.
Se corrigió la columna vacía de 325 píxeles en pantallas profesionales sin contenido
lateral, el icono estirado del submenú de Plan y el desbordamiento del diario móvil
causado por un texto accesible con posición absoluta. El pie de Inicio móvil queda
después del calendario y la actividad reciente.

Figma contiene datos de ejemplo, reseñas, autores y promociones que Plan V no tiene.
No se copiaron como si fueran datos reales. Tampoco dibuja el consultorio: sus accesos
y ficha son adaptaciones operativas con la misma piel. Estas diferencias están
documentadas; no se afirma una equivalencia de todas las capturas píxel por píxel.

## Verificación

- `npm test`: 213 archivos, 1.114 pruebas aprobadas y dos omitidas por configuración.
- `npm run check` y `npm run build`: aprobados.
- Navegador gstack en modo demo local, escritorio 1440 y móvil 390: diez pantallas
  de paciente y doce del consultorio en ambos tamaños. Sin desbordamiento horizontal
  de documento ni iconos de fuente vacíos. El desplazamiento de las tablas es interno.
- Detalles de receta y recurso abiertos y capturados en 1440/390. La receta de prueba
  se creó por la interfaz en la memoria del modo demo; no se llamó a generación de IA.
- Directorio → ficha de Marina → plan conserva selección; abrir el plan desde su fila
  y recargar conserva el mismo paciente. Selección inexistente no muestra ficha ajena.
- Selector y accesos probados en celular; menú probado con Escape y retorno de foco.
- Inicio paciente → buscar «Wrap» → Plan conserva «Wrap»; el rol paciente no presenta
  accesos del consultorio. Detalle de recurso conserva el prefijo de cada rol.
- Revisión independiente de código y comprobación de realidad: hallazgos corregidos.

Las capturas y registros locales están en `.gstack/figma-*.png` y
`.gstack/figma-ui-*.json`. El informe de medidas sin contenido de pacientes se conserva
en [browser-verification.json](../design/figma-reference/browser-verification.json).
Los recorridos locales prueban esta implementación; no sustituyen una comprobación
del despliegue después de integrar el PR.
