# Nutrigo local → Plan V: referencia y convergencia

> Actualización de alcance 2026-09-16: el usuario confirmó PWA paciente + CRM web, fotos de comidas, estudios y fotos corporales opcionales desde el inicio. Las exclusiones históricas de fotos corporales que aparecen más abajo quedan superadas en **alcance**, no en implementación ni privacidad. El [plan revisado](plan-de-accion-2026-09-16.md) conserva las doce superficies y ordena su paso a producción.

## Dirección solicitada

El producto para el paciente sigue **toda la estructura de diseño y las funciones de Nutrigo**. Encima se agregan sólo los vínculos con la nutricionista (invitación, plan publicado, revisión, turno, mensajes, asignaciones). Eso se refleja en el CRM multipaciente; no se sustituye el consultorio por un tracker suelto ni se recorta la app paciente “porque es clínica”.

Marca, copy e identidades son Plan V. No copiar assets ni cifras clínicas del kit. La autorización para desarrollar no implica aprobación visual del resultado ni autorización para usar datos clínicos reales.

## Fuente verificada

- Carpeta: `../nutrigo_reference/Nutrigo - Nutrition & Diet Dashboard/`.
- Fuente editable: `Nutrigo - Nutrition & Diet Dashboard.fig`.
- Ayuda: `Documentation.pdf`, 5 páginas.
- Página Figma principal: `💻 Interface` (`1:2`), **36 frames: 12 superficies × escritorio/tablet/móvil**.
- Anchos verificados: escritorio 1440, tablet 800, móvil 390 px. Las alturas varían por pantalla; no son viewports fijos de la aplicación.
- Página de sistema: `🎨 Style & Component`: Typography, Element, Component, Color y Frame 1.
- Se excluye `Internal Only Canvas` del conteo de pantallas de producto.
- Inventario reproducible: `.scratch/nutrigo-local-reference/inventory.py` y `inventory.json`; nodos decodificados desde el archivo local, sin subirlo a servicios externos.

**Límite del relevamiento:** se verificaron todos los frames principales, sus dimensiones, textos explícitos y estructura. Los textos y comportamientos heredados de instancias requieren resolver componentes/overrides y revisión visual adicional. Un diseño estático no demuestra que existan backend, validaciones, envío de mensajes o CRUD; no se declara todavía auditado cada control.

## Sistema visual observado

- Fuente principal **Poppins**, confirmada por documentación, página Typography y uso dominante en pantallas. Hay componentes heredados con Figtree, Plus Jakarta Sans, Lato e Inter: no importar cinco familias automáticamente ni asumir que esos residuos son la intención tipográfica.
- Dashboard escritorio `12:792`: 1440 × 1232. Sidebar `12:793`: **223 px**. Contenido `28:417`: **892 px**. Panel derecho `33:1104`: **325 px**.
- Contenido: padding lateral **28 px**, ancho interior **836 px**; encabezado a y=28, altura 50; cuerpo a y=106.
- Estadísticas: 836 × 142, separación 16. Objetivo/nutrición: 836 × 306, separación 20. Seguimiento: 836 × 138. Recomendaciones: 836 × 404.
- Panel derecho: padding 28; ancho interior 269; perfil a y=28 y plan a y=106. Calendario 269 × 128, radio 12.
- No aplicar el mismo panel derecho a todas las rutas: Calendar conserva 325; Healthy Menu usa 345; Insights usa 305; Messages, Recipe Details, Meal Plan, Grocery, Food Diary, Progress, Exercise e Insight Details usan el área restante sin ese rail global.
- Mantener logo y paleta oficial Plan V; toda la interfaz en español. No copiar los nombres, las cifras clínicas, las recomendaciones ni las identidades del kit.
- No reemplazar todavía las rutas originales: la comparación previa sigue NO APROBADA. El showroom permite ajustar y verificar sin perder funciones.

## Matriz bidireccional de superficies

Los estados de Plan V distinguen funcionalidad existente en la aplicación original de la vista provisional del showroom.

| Nutrigo (frame escritorio) | Base de Plan V que se conserva | Brecha y adaptación requerida |
| --- | --- | --- |
| Dashboard (`12:792`) | Resumen seguro de hábitos, comidas, objetivos; revisión profesional | Rehacer composición desde medidas fuente; dashboard individual y consultorio agregado, sin inventar peso, pasos o metas calóricas |
| Calendar (`84:1666`) | Agenda profesional agregada y Agenda paciente Nutrigo con vistas mes/semana/día sobre eventos reales: próxima consulta, plan de la semana calendario actual, diario y actividad. Eco de la paciente seleccionada en el CRM. Avisos in-app de próximas consultas en ambos roles | Timezone, conflictos, historial longitudinal de consultas y notificaciones push/mail; la gestión del turno sigue siendo profesional |
| Messages (`84:2565`) | Superficie Nutrigo operativa: hilo privado, envío paciente/profesional, actualización, inbox multipaciente con búsqueda/selección y perfil contextual con navegación a Agenda, Ficha y Consultas | Faltan entrega/lectura persistidas, no leídos, adjuntos y archivos compartidos; medios requieren contrato y Storage privado |
| Healthy Menu (`84:2716`) | Superficie paciente Nutrigo operativa derivada sólo del plan publicado: títulos deduplicados, días, momentos, ocurrencias, búsqueda, filtros y enlaces a Plan/Compras; imágenes explícitamente ilustrativas | Falta una biblioteca de recetas real, categorías editoriales, favoritos/recomendadas y asignación profesional; no presentar títulos del plan como recetas estructuradas |
| Recipe Details (`84:3145`) | Sin entidad de receta estructurada completa | Ingredientes, porciones, instrucciones, utensilios, tiempos, notas y datos nutricionales con fuente. Reviews/Health Score requieren reglas de producto: no generar puntuaciones clínicas |
| Meal Plan (`84:2994`) | Editor profesional y vista paciente Nutrigo operativos sobre el mismo plan vigente: siete días, selección diaria, búsqueda y lectura sin controles profesionales | Modelo fechado/versionado y navegación temporal real; vincular recetas, porciones y cantidades sin perder indicaciones libres ni selección multipaciente |
| Grocery List (`105:2472`) | Superficie paciente Nutrigo operativa: derivación conservadora del plan vigente, categorías, deduplicación, ocurrencias, check local por paciente, filtros y exportación | Modelar ingredientes, cantidades, unidades y agregados manuales; no inferirlos. El kit muestra total/gastos: mantenerlos en backlog hasta confirmar utilidad |
| Food Diary (`105:2649`) | Superficie paciente Nutrigo operativa: resumen real, cronología, búsqueda, filtros por estado, macros sólo en revisadas y registro foto/texto + IA con el circuito existente | Historial navegable por fecha, relación registro ↔ plan y detalle de revisión visible al paciente; conservar autoría profesional y notas ocultas |
| Progress (`105:2790`) | Superficie paciente Nutrigo operativa con adherencia, objetivo publicado, agua, sueño, energía, comidas revisadas, períodos 7/30/90 y comparativa del mismo paciente (medidas con fuente; sin ranking) | Fotografías corporales y paridad visual 1440/800/390 siguen aparte (PV-37). Live schema de progreso bloqueado si el proyecto tiene `patients` |
| Exercise (`105:2931`) | Superficie paciente Nutrigo operativa para actividad autodeclarada: alta, duración, intensidad percibida, nota, resumen real de siete días e historial; la profesional la lee aislada por paciente desde Actividades | Persistir `activity_logs` y definir RLS/retención; biblioteca y asignación de rutinas sólo por profesional habilitado. Sin calorías, series, repeticiones ni prescripción inferida |
| Insights (`263:6588`) | Recursos paciente operativo con seis guías originales, categorías, destacado, búsqueda, guardado local y bloque de asignadas; Guardado profesional permite asignación individual/masiva y muestra pendiente/leído por paciente | Falta contenido editorial clínico revisado y persistencia Supabase/RLS/auditoría; no publicación clínica automática |
| Insight Details (`279:9301`) | Detalle operativo con secciones, tags, relacionados, límite editorial, navegación, enlace profundo, compartir/copy-link y registro de lectura sólo para asignaciones válidas | Falta entidad editorial persistida, autoría profesional y contrato de publicación/asignación para datos reales |

Cada superficie tiene su propia variante tablet y móvil verificada en `inventory.json`. Implementar su reorganización, no encoger el escritorio mecánicamente. Oscuro es una capacidad propia de Plan V: conservarlo; no se identificó una colección de frames oscuros en el inventario.

### Capacidades propias de Plan V, obligatorias en el diseño unificado

- Once módulos: Inicio, Reciente, Guardado, Centro de seguimiento, Paneles, Actividades, Pacientes, Fichas, Videollamadas, Agenda, Objetivos.
- Mi trabajo y Mi seguimiento separados del menú principal; selección/lista multipaciente y contexto conservado al editar y volver.
- Ficha, historial, notas y borradores profesionales privados; el paciente nunca recibe esos campos.
- Creación, edición, archivo y restauración de pacientes sin borrar historia.
- Objetivos con historial y progreso; revisión profesional de las comidas; intercambio bidireccional de mensajes y planes.
- Tema oscuro persistente y estados claros de carga/error/vacío.
- Barreras existentes de acceso, facturación, invitaciones y modo demo, sin declarar operativas integraciones pendientes.

## Secuencia de implementación

1. **Fuente y medidas:** inventario local, mapa de brechas y especificación del shell. Aceptación: 36 frames únicos clasificados y dimensiones trazables. Verificación: script de inventario y revisión documental. Sin dependencias.
2. **Shell paciente desde fuente:** aplicar sidebar/panel/padding del Dashboard a 1440 sin cambiar datos ni CRM. Aceptación: medidas DOM coinciden y móvil conserva navegación. Verificación: navegador y capturas. Dependencia: 1. Archivos: `patient-dashboard.css` y evidencia de navegador.
3. **Tipografía y componentes:** Poppins confirmada e incorporada; resolver estilos heredados, medir cards/controles y rehacer dashboard. Aceptación: comparación fuente/render a mismo ancho, sin nuevos assets no autorizados. Dependencia: 2. Dividir por shell/cards/rail.
4. **CRM multipaciente:** aplicar sistema resuelto conservando once módulos, selector y acciones. Aceptación: selección aislada y formularios accesibles, sin KPIs duplicados que desplacen el contenido. Dependencia: 3.
5. **Checkpoint visual:** escritorio/tablet/móvil y oscuro; aprobación explícita, no por tests.
6. **Migración operativa por cortes:** pacientes/ficha → plan/revisión → agenda/mensajes. Cada corte termina con edición/guardado/lectura posterior, aislamiento del otro paciente y diseño integrado; el puente al CRM antiguo no es la solución final.
7. **Funciones nuevas por cortes verticales:** recetas/detalle → plan con recetas → compras → recursos/detalle. Primero acciones/modelos/serializers y contrato demo; luego API/interfaz profesional/interfaz paciente. Cada entidad nueva necesita permisos y prueba de exclusión de campos privados.
8. **Dominios sensibles e integraciones:** alcance de medidas/actividad, privacidad, contrato ampliado 016/RLS y proveedores aprobados antes de datos reales. No ejecutar el draft SQL.

## Decisiones confirmadas y estado de implementación

### Primer corte verificado

Se ajustó únicamente `patient-dashboard.css`: ancho sidebar y barra inferior, panel derecho, padding del contenido/rail y separación del encabezado. En un canvas de escritorio de 1440 sin scrollbar vertical se midieron 223/892/325 px y comienzo del cuerpo a y=106. Con scrollbar clásica de Windows el contenido central absorbe sus 15 px; no se oculta el scroll para simular paridad.

El navegador produjo 8 capturas únicas (1440/800/390/320, claro/oscuro), sin overflow horizontal ni errores JS en el recorrido. Se verificaron menú móvil → plan y conservación de los once módulos CRM. Se inspeccionaron visualmente escritorio claro y móvil oscuro. `git diff --check` pasó con avisos preexistentes de LF/CRLF. No se ejecutó la suite ni se declara validada la aplicación completa: este corte no cambia lógica, datos ni integraciones. Dashboard, componentes, tipografía y páginas restantes siguen pendientes de adaptación y aprobación.

El usuario respondió explícitamente a las tres preguntas:

- **Poppins aprobada.** Incorporada localmente al showroom paciente/CRM con `@fontsource/poppins` 5.3.0 (OFL-1.1), subset latino, pesos 400–800 y `font-display: swap`. Las pantallas originales mantienen sus fuentes hasta la migración visual.
- **Pack licenciado según confirmación del usuario:** «todo este pack es porque pague la licencia». Se acepta como autorización para utilizar el pack en Plan V; no equivale a revisión independiente del texto legal. Registrar origen de imágenes al integrarlas y no hotlinkear previews.
- **Alcance aprobado:** peso y medidas opcionales, registro de actividad y rutinas asignadas por un profesional habilitado. Aún no implementados por esta confirmación: necesitan modelo, historial, permisos y flujos de ambos roles. La habilitación para prescribir debe verificarse en servidor, no deducirse de ser nutricionista ni de un checkbox editable por el paciente.

Fotografías corporales, presupuesto de compras y reglas editoriales no están incluidos automáticamente en estas respuestas. Consentimiento, retención, acreditación profesional y contrato 016/RLS siguen pendientes antes de datos reales. No hay autorización de producción, migraciones o publicación externa. La aprobación del alcance tampoco aprueba visualmente la interfaz actual.

### Verificación de Poppins

`verify-poppins.py` comprobó cinco pesos cargados desde localhost, tipografía computada de shell y encabezado, paciente/CRM en escritorio claro y móvil oscuro (4 vistas), sin overflow horizontal ni errores JS en el recorrido. Capturas e informe en `.scratch/nutrigo-local-reference/poppins/`. Se inspeccionaron paciente escritorio y CRM móvil. Build de producción y `git diff --check` aprobados; el build no valida el showroom DEV, que se comprobó por separado. No se ejecutaron tests/linters ni se hicieron commits en este corte.
