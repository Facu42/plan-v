# Fase 1: base visual del panel de la nutricionista

19/10/2026 · Codex · rama `codex/panel-nutri-fase-1` · base `79056fe` (PR #148).

## Qué cambia

- Paleta del boceto en `panel-nutri-tokens.css`, Poppins y estilos limitados al panel profesional. Se ajusta el gris auxiliar claro a #66686F para texto pequeño AA.
- Tema claro, oscuro y como el sistema, seleccionable desde Configuración y la cuenta. Preferencia por usuaria en metadatos de Auth (`panel_theme`) y caché local por cuenta. Un fallo de sincronización conserva la elección local pendiente y permite reintentar. No cambia roles ni permisos.
- Menú de 288 px o 84 px, logo de 52 px, cinco grupos, submenús del apartado actual, línea en árbol, conteos reales y persistencia del plegado. En celular: cajón, foco contenido, Escape con retorno al disparador y barra inferior de cinco destinos.
- Filtros del directorio, cobranzas y mensajes conectados a sus controles reales. Disponibilidad, reservas y página pública abren la sección de agenda correspondiente. Todos los planes permite elegir una paciente para abrir su editor existente. Equipo abre su componente existente dentro del panel; /equipo conserva su acceso anterior para recepción.
- Foto propia de comida reducida y desenfocada previamente (`public/panel-nutri/comida-suave.jpg`), con capa uniforme sobre las tarjetas de indicadores. Sin filtros de desenfoque en vivo, GSAP ni dependencias nuevas.
- Panel contenido en 100dvh en escritorio, listas y chat con desplazamiento interno; página desplazable en celular. Corregidos desbordes del catálogo de Recetas y del texto auxiliar de Biblioteca.

## Alcance y continuidad

Esta entrega completa la base de la fase 1, no las pantallas de las fases siguientes. El cuerpo de Inicio sigue siendo la bandeja existente; el resumen del día, próxima consulta y accesos rápidos del boceto corresponden a fase 2 y reutilizarán la foto y las capas ya preparadas. La ficha conserva sus secciones actuales hasta fase 4.

Pedidos de cambio y respuestas guardadas no existen en la base de este PR. Según la regla 2.4 del plan, no se muestran opciones sin función: quedan para fase 7 y fase 6, respectivamente. El PR #147 de Cursor es anterior al boceto vigente, utiliza otra base y tipografía: esta rama no lo modifica ni depende de él.

Las vistas largas de formularios y editores todavía desplazan el área central; no se afirma que cada tarjeta clínica tenga su propio desplazamiento. La página exterior queda contenida a 1440×900. La revisión AA cubre los tokens nuevos y los estados de la ficha corregidos, no una certificación de accesibilidad global. No se probó la sincronización con una cuenta real en producción: el navegador usó exclusivamente la demostración local.

[Comparación visual navegable](../../design/panel-nutri/fase-1-verificacion.html) · [Resultados de navegador](../../design/panel-nutri/fase-1/resultados.json)

## Comprobaciones

- `npm test -- --maxWorkers=4`: suite completa, 3.132 aprobadas y dos omitidas (483 archivos). La ejecución sin límite encontró un timeout de PGlite bajo carga; se repitió la suite completa con cuatro procesos, sin cambiar la prueba ni sus tiempos.
- `npm run check`, `npm run build` y `npm run check:secrets`: aprobados. La compilación conserva el aviso de paquetes grandes existente.
- `node scripts/panel-nutri-qa.mjs` usando /browse: 22 comprobaciones y matriz de 18 pantallas por dos temas por dos tamaños (1440×900 y 390×844), incluida ficha. Comprueba dimensiones, filtros, plegado por teclado, aislamiento del cajón, retorno de foco, selectores independientes, tema del sistema y recuperación tras recarga. Capturas principales, no 72 capturas distintas.
- Pruebas nuevas: preferencias y aislamiento por cuenta, valor inválido, almacenamiento bloqueado, sincronización pendiente, navegación y conteos, grupos independientes de radio, vacíos, 1.284 pacientes y contraste de tokens claros/oscuros. La primera prueba se ejecutó antes de implementar y falló por el módulo ausente.
- Fire test local: se sustituyó temporalmente el resolutor para ignorar el tema explícito; la prueba falló como se esperaba. Se restauró el archivo y las pruebas focales pasaron.
- Revisión independiente de código: cerrados los defectos de altura de chat, grupos de radio y recuperación de una elección pendiente. Revisión visual independiente: barra móvil y contraste de pestaña/etiquetas de ficha corregidos.
- Impeccable detectó una advertencia por animación de ancho: es el plegado 288→84 px en 280 ms pedido expresamente por Facundo. Submenús de 260 ms; con reducir movimiento sólo fundidos. No se declara rendimiento medido en un teléfono físico.

## Regression Guard — paso 10

- **Flujos críticos verificados:** ✅ ingreso y separación de roles (suite existente); ✅ navegación y ficha, enlaces con seccion y protección de cambios sin guardar (app-location, patient-record-sections y unsaved-changes); ✅ directorio, invitaciones y archivo (showroom-patients); ✅ plan y versiones (meal-plan-versions); ✅ cobranzas (cobranzas); ✅ mensajería y adjuntos (pruebas de cliente/servidor existentes). Tema, filtros, foco y dimensiones se comprobaron además en navegador local.
- **Regresiones cubiertas:** estados de submenús distintos no se confunden; caché por cuenta no cambia el tema de paciente; selección local no se pierde si falla sincronizar; dos selectores no comparten radios; campo de mensajes no queda cortado; fichas usan tinta sobre lima/amarillo; el cajón devuelve el foco después de retirar inert.
- **Contratos revisados:** props de filtros iniciales conectadas a controles existentes; rutas /crm y enlaces seccion conservados; metadato cosmético validado light/dark/system mediante Auth de la cuenta actual. Sin cambios de contratos clínicos, cobros ni permisos.
- **Áreas frágiles:** cascada de estilos anteriores (ámbito pn-panel y comprobación clara/oscura), URL y remonte del área principal (filtros probados), almacenamiento/perfil (caché aislada y pendiente), altura de chat y foco móvil (mediciones y teclado). Nada de la fuente o pantallas Nutrigo de la paciente se rediseñó.
- **Migraciones:** N/A. Sin SQL, cambios de producción, claves ni servicios pagos.
- **Fire test:** detectado ✅; resolutor alterado localmente, fallo esperado y restauración comprobada.
- **Automatizaciones nuevas:** pruebas de preferencias/contraste dentro de npm test y recorrido reproducible /browse en scripts/panel-nutri-qa.mjs. Sin pasos nuevos de despliegue o variables obligatorias de producción.
- **Veredicto:** SHIP para revisar la fase 1 en su propio PR. No afirma cierre de las fases 2–9 ni despliegue realizado.

## Cómo continuar

Sigue **fase 2: Inicio**. Leer la última entrada de la Bitácora, crear otra rama desde la base aprobada y abrir `ProfessionalWorkQueue.tsx`, `InicioIndicators.tsx` y `server/crm/repository.ts`. Construir los bloques del Inicio del boceto con datos reales, conservando el armazón, tokens, foto preparada y sus pruebas.
