# Equipo · boceto v29

Armado con el código del boceto (`eqV0`, `eqV1` y `eqV2` de `design/panel-nutri/v29/panel-trabajo.html`, mismas clases y orden): Integrantes, Permisos y Registro de accesos. Archivos: `PanelEquipo.tsx` (datos y diálogo de invitar, sin cambios de lógica), `PanelEquipoVistas.tsx` (las tres vistas) y `ficha-equipo.ts` (roles, módulos, niveles, iniciales).

## Qué es real y qué no
Real: integrantes (dueña, nutricionistas de la organización, recepción), estado, invitar y quitar el acceso de recepción.
Todavía sin base (paquete C, espera la frase de Facundo): último ingreso, dos pasos, sesiones abiertas, actividad, permisos guardados por persona y registro de accesos.

## Defaults elegidos (el archivo dibuja algo que la app no tiene)
- Los bloques del boceto no se ocultan: sin dato muestran «—», «Sin dato», cero o un texto corto («Todavía no hay actividad registrada.»). No se inventan eventos de ejemplo.
- La matriz de permisos muestra el nivel según el rol (la referencia del boceto), deshabilitada, con el aviso «los permisos por módulo todavía no se guardan uno por uno».
- «Editar roles», «Cambiar» (pacientes que ve) y «Descargar» quedan deshabilitados con su razón hasta que exista el registro y los permisos guardados.
- «Pausar acceso» del boceto se resuelve como «Quitar acceso de recepción» (lo que la app hace hoy).
- Las reglas fijas son las del boceto más las dos que ya aplicaba la app.
- Debajo quedan las herramientas de siempre (asignaciones clínicas, organizaciones y recepción).

## Revisión contra el código del boceto
Árbol del boceto vs. app (con un equipo simulado de cuatro personas), elemento por elemento y en las tres vistas: mismas clases, orden y medidas. Difieren solo textos largos (mails), cantidad de filas y los bloques que hoy muestran un texto corto en lugar de datos. Se corrigió en esta pasada: tablas sin ancho fijo, peso de las cifras (la hoja vieja ponía 500 a toda `<b>`), encabezado del registro sin salto de línea y grilla 1,6fr/1fr del registro.

## Informe Regression Guard (paso 10)
- Flujos: invitar (recepción y nutricionista), quitar acceso de recepción, cambio de consultorio y de equipo, asignaciones clínicas.
- Regresiones: ninguna esperada; no cambia API ni permisos. Se conserva «Cargando equipo» y los encabezados al renderizar sin datos.
- Contratos: sin rutas ni tablas nuevas. Migraciones: ninguna. Automatizaciones: ninguna. Fire test: no aplica.
- Tests: 3 nuevos (`ficha-equipo.test.ts`) y los de siempre.
- Veredicto: listo para ok visual.
