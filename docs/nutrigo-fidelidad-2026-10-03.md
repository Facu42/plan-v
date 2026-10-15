# Fidelidad Nutrigo — 2026-10-03

## Corrección de alcance de Facundo

El 2026-10-03 Facundo rechazó continuar ajustando la interfaz existente mediante
comparación visual. Pidió usar directamente el proyecto desarrollado en Figma,
conectarlo al backend y no tomar más capturas. Se detuvieron esas tareas. Los
cambios descritos debajo quedan locales, sin commit, PR ni publicación.

El enlace conocido es Figma Design; su MCP entregó código de presentación de
los nodos. No se obtuvo el repositorio original de una aplicación completa. La
consulta de Code Connect no permitió comprobar vínculos de componentes porque
la cuenta requiere otro tipo de asiento/plan; no se contrató nada. Hay archivos
antiguos de Figma Make en src/components, pero corresponden a otra composición
(Hoy/Calorías), no se verificó que sean el proyecto solicitado. Hace falta
identificar el proyecto fuente de Figma Make o su exportación antes de sustituir
la interfaz. No se continúa QA visual ni se publica esta rama.

Facundo indicó luego `nutrigo_reference` como fuente. Se inspeccionó esa carpeta
sin capturas: incluye `Nutrigo - Nutrition & Diet Dashboard.fig` (325.774.092 bytes)
y `Documentation.pdf`, además de metadatos de macOS. El contenedor .fig tiene
171 entradas: canvas binario, miniatura, metadatos e imágenes; no contiene archivos
JS/TS/React/HTML/CSS ni package.json. Se leyó completo el PDF de cinco páginas:
documenta la importación del .fig, tipografía, fuentes de imágenes y edición de
estilos de texto/color. No enlaza una exportación del frontend. Esta entrega es
el diseño, no el proyecto fuente de una app. No se modificó la carpeta original.

Facundo confirmó «si ese» al archivo Nutrigo y pidió continuar su integración con
el backend actual. Rama `codex/nutrigo-fidelidad-completa`, desde `d976213` (PR #53).
La publicación se hace mediante el PR de esta rama; su descripción registra el
commit integrado y la comprobación posterior de los tres despliegues.

## Fuente y cambios

Referencia: [Nutrigo](https://www.figma.com/design/OTolnKfsxUFjaZOhhdb04i/Nutrigo---Nutrition---Diet-Dashboard).
Se reutilizó el código completo de los 24 nodos obtenido mediante el MCP de Figma,
con contexto y captura nuevos de Inicio escritorio/móvil. Inventario de nodos en
`design/figma-reference/manifest.json`. Los valores provienen del código del archivo.

- Inicio: dimensiones y posiciones originales de estadísticas, peso, nutrición,
  ejercicios, menú y columna del día; controles de fecha y comidas conectados.
- Agenda, Menú, detalle de receta y Plan: fondos, separación, campos, orden móvil,
  controles y SVG originales. Se conserva la consulta de la semana completa.
- Compras, Diario, Progreso, Ejercicio, Recursos, detalle de guía y Mensajes:
  columnas, gráficos, espacios, fondos, controles y recursos originales. La búsqueda,
  los filtros y los registros siguen accesibles; los períodos de progreso se abren
  desde «Mis registros».
- Navegación de 223 px y encabezado móvil de 64 px; cajón móvil cerrado fuera de la
  pantalla, retorno con Escape y botón para volver de los detalles en ambos tamaños.
- Recursos: columna central de 855 px y lateral de 305 px hasta el borde derecho.
  Mensajes móvil comienza en y=64, sin separación extra bajo el encabezado.
- Se verificaron 130 archivos SVG originales contra su huella y dimensiones;
  `design/figma-reference/fidelity-assets.json` registra su procedencia. Incluyen
  variantes activas de navegación y variantes móviles de los iconos de ejercicio.

La fuente no incluye CRM, autenticación ni onboarding. Se conserva su diseño
funcional existente. Pacientes, Ficha y Plan permanecen a mano y mantienen la
selección al cambiar de pantalla, también en móvil.

## Adaptaciones necesarias al producto

La marca es Plan V y el texto está en español. Las fechas, nombres, comidas y
registros provienen de la API. Las reseñas, puntuaciones de salud, metas, gasto
calórico y nutrientes inexistentes se muestran sin valores. Los espacios de fotos
mantienen el estado de imagen disponible o pendiente del backend. No se copian las
cifras clínicas, promociones comerciales ni conversaciones ficticias del pack.

El selector del día muestra los siete días del plan operativo; las flechas recorren
esos días. La fuente dibuja seis fechas de ejemplo. No se inventa un mes de planes.
Las casillas permiten abrir registros existentes o el formulario de hoy; abrir el
formulario no guarda una comida. En Ejercicio, «rep.» conserva la cantidad y evita
invadir la columna de pausa en los 50 px previstos por la fuente móvil.

## Verificación

- `npm test`: 216 archivos aprobados, 1.165 pruebas aprobadas y dos omitidas de
  integración que requieren un entorno específico. Ninguna fallida.
- `npm run check`, `npm run build`, `npm run check:secrets` y `git diff --check`
  aprobados. Build conserva el aviso de tamaño de un bloque superior a 500 kB;
  no impide publicar y no constituye una nueva división de código en este cambio.
- Navegador gstack a 1440 y 390 en doce pantallas/detalles (24 capturas y mediciones),
  sin desbordamiento horizontal del documento ni imágenes rotas. Las tablas móviles
  conservan desplazamiento dentro de su región.
- Comprobaciones locales: filtros de Compras/Diario, búsqueda y abrir/volver de
  Recursos, menú/Escape, receta publicada/asignada, cambio de porciones 2→3 con
  ingredientes escalados, favorito conservado al reabrir, período de progreso de
  30 días, rutinas asignadas con tres filas y accesos CRM conservando `pat-marina`.
- Revisión independiente `code-reviewer`: sin hallazgos accionables tras corregir
  el retorno de Recursos. `ui-finish-gate-reviewer` / `reality-checker`: diferencias
  de Mensajes, bordes, Recursos y texto de repeticiones corregidas y revalidadas.

Evidencia local reproducible en `.gstack/nutrigo-fidelity/`: `final-tests.json`,
`final-primary-report.json`, `final-secondary-*.json`, capturas `final-*.png` y
registros finales de check/build. Es un directorio ignorado; no contiene datos de
pacientes reales en estas capturas. Los fixtures se crearon únicamente en la API
demo local, usando sus endpoints normales, sin generación con IA.

La comparación valida estructura, recursos y medidas; no es un certificado de
igualdad de cada píxel, porque los datos y estados reales difieren del ejemplo.
La prueba en producción se limita al despliegue, ingreso y lectura con cuentas
ficticias; no completa permisos ni fichas de salud de esas cuentas.

## Alcance conservado

Sin cambios de backend, migraciones, variables de producción ni servicios nuevos.
Sin llamadas pagas de IA ni contrataciones de Supabase. Los pendientes previos de
fotos IA, generación real de texto, ajuste automático a la meta calórica y conservación
de una meta confirmada al guardar borradores continúan en sus documentos de IA.
