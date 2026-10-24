# Continuar el boceto v29 con Cursor

## Decisión vigente de Facundo — 24/10/2026

«Quiero seguir dibujando las pantallas que faltan con Cursor. Dejá la v29 para seguir desde ahí».

La base es [`design/panel-nutri/v29/PlanV-Boceto-v29.html`](../../design/panel-nutri/v29/PlanV-Boceto-v29.html), el archivo original adjuntado por Facundo. v30 y v31 se descartaron. Esta decisión reemplaza, para continuar el dibujo del boceto, las referencias antiguas a una versión 26 o al enlace de Claude. No cambia por sí sola la referencia ni los contratos de la app productiva.

## Alcance de la próxima sesión

Trabajar únicamente en diseño e interacciones locales del boceto. No implementar estas pantallas en `src/`, no tocar backend, base de datos, credenciales ni despliegues de producción. La app del paciente ya existe: consultarla cuando haga falta y respetar su diseño de Nutrigo; no rediseñarla ni simular una sincronización real desde el boceto.

Leer `AGENTS.md`, `docs/coordinacion-agentes.md`, las reglas del proyecto y `docs/nutreando/plan.md`. El traspaso `traspaso-boceto-v3.md` sirve para entender la historia, las funciones y los componentes. Donde contradiga la elección de versión y el modo de continuar, manda este documento.

## Forma de trabajo

1. Traer esta entrega del repositorio y verificar la huella del HTML con el README de v29. Abrir el archivo original y recorrerlo antes de editar. No reconstruirlo desde cero.
2. Crear `design/panel-nutri/v29/panel-trabajo.html` como copia de la v29; conservar el original intacto para poder volver a él. Trabajar en una rama propia `cursor/*`, sin pisar las ramas de otros agentes.
3. Relevar qué pantallas, subpantallas, diálogos, estados y funciones faltan. Contrastar el boceto con las funciones del proyecto y el relevamiento de Nutreando. No confundir una pantalla rotulada «Hecha» con todos sus estados completos, ni inventar que falta algo que ya está desarrollado.
4. Mostrar a Facundo una lista corta y ordenada de faltantes y avanzar con la primera pantalla de diseño pendiente dentro de ese alcance. Si para elegirla falta una decisión de producto, hacer una pregunta concreta.
5. Conservar los colores, tipografía, densidad, tarjetas, encabezados, navegación y comportamiento de la v29. Reutilizar sus componentes y movimientos. Cambiar una pantalla o subfunción por vez; no rediseñar las ya existentes sin pedido.
6. Todos los controles nuevos deben funcionar dentro del boceto: abrir paneles, cambiar estados, navegar o descargar archivos de ejemplo. Mantener claro qué es una simulación; no presentar integraciones reales como conectadas.
7. Comprobar 1440×900 y móvil 390, claro y oscuro, navegación de ida y vuelta, textos largos, listas con scroll interno y reducción de movimiento. Mirar la interfaz; una comprobación de sintaxis no valida la distribución visual.
8. Guardar cada avance en Git y registrar el alcance y la próxima pantalla. Mantener un solo boceto navegable de trabajo y presentar una vista previa local. Publicar en el sitio de revisión solo si hay herramientas y autorización; nunca inventar que el enlace fue actualizado ni sustituir la v29 original con el archivo de trabajo.

No reaplicar las 13 anotaciones de la sesión descartada salvo que Facundo vuelva a pedirlas. La selección de v29 autoriza continuar el diseño, no aprueba el boceto entero ni autoriza pasar cambios a producción.

## Texto listo para pegar en Cursor

Leé `docs/panel-nutri-rediseno/continuar-v29-cursor.md` y seguí sus instrucciones. La base vigente es `design/panel-nutri/v29/PlanV-Boceto-v29.html`. Conservá ese original y creá una copia de trabajo. Quiero seguir dibujando las pantallas, subpantallas y funciones faltantes del boceto, manteniendo exactamente su estilo y sus interacciones. Primero revisá lo que ya existe y el relevamiento de Nutreando; mostrámelos en una lista breve y empezá por la primera pantalla pendiente. No reconstruyas el dashboard ni recuperes los cambios descartados de v30/v31. Trabajá solo sobre el boceto, sin modificar la app productiva ni la base. Mostrame una vista previa navegable y avanzá una pantalla por vez.

## Verificación de esta entrega

El HTML archivado es idéntico, byte por byte, al adjunto v29 de Facundo. Se comprueba su SHA-256 y la sintaxis de los scripts inline. Los cambios de esta entrega son la copia de referencia y la documentación de continuidad; no se cambia código ejecutado por la app, contratos ni migraciones.
