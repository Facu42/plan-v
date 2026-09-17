# Dashboard de implementación de Plan V

Tablero local del plan del 16 de septiembre de 2026. Incluye las 39 entregas, siete hitos, doce hallazgos y una vista específica de las cinco brechas principales. Es una herramienta de seguimiento del desarrollo.

## Abrir

Desde `plan-v/`, con las dependencias del proyecto instaladas:

```powershell
npm run dashboard
```

Abrir <http://127.0.0.1:4317>. Para otro puerto, definir `PLAN_V_DASHBOARD_PORT`. Se escucha únicamente en loopback. No publicar este servidor en Internet: es una herramienta local sin autenticación multiusuario.

## Usar

- Vista general: avance del trabajo restante, entregas listas, bloqueos reportados y recorrido por hitos.
- Entregas: búsqueda, filtros, tabla o tablero por estado. Abrir un ticket para editar estado, responsable, notas y evidencia.
- Hoja de ruta: hitos con sus tickets y dependencias individuales.
- Hallazgos: evidencia de arquitectura y tickets que abordan cada problema.
- Actividad: registro de cambios efectuados por la API del tablero.
- Documentación: acceso a las cuatro fuentes de planificación y al registro histórico de verificaciones.
- Exportar: descarga del tablero completo en JSON, incluyendo notas y evidencia.

Los estados iniciales están pendientes: no se asigna un porcentaje de avance a toda la app ni se cuenta la demo como producción terminada. Los cierres son registros del usuario; el tablero no ejecuta pruebas ni audita automáticamente el código. Se requiere evidencia y dependencias completas para cerrar; se permite preparar tareas cuyos prerrequisitos siguen pendientes. Para reabrir una tarea con dependientes completos, reabrir primero esos dependientes.

## Fuentes y guardado

- Backlog y criterios: `docs/plan-de-accion-2026-09-16.md`.
- Estado persistente: `tasks/implementation-status.json`. Guardado atómico e historial; conservarlo junto al proyecto. Evitar datos de pacientes en notas.
- Títulos breves, agrupación de hitos y relaciones de hallazgos: `implementation-dashboard/catalog.mjs`.

El tablero lee la fuente cada 15 segundos mientras está visible. Una revisión conjunta del plan y los estados evita sobreescribir fichas desactualizadas: si cambió la fuente o alguien guardó mientras editabas, muestra un conflicto y permite recargar. El archivo de estado da error visible si está corrupto; no se restablece silenciosamente. Una instancia del servidor por archivo de estado; la serialización cubre solicitudes concurrentes de esa instancia.

La modificación externa del archivo de estado se refleja en la siguiente lectura, pero no crea por sí misma un evento de actividad. Las ediciones normales deben hacerse desde la ficha. Si se agregan nuevos IDs o cambian los hitos, actualizar también el catálogo y la verificación del plan. Si se decide cobrar durante el piloto, actualizar PV-32/PV-33 en el documento fuente.

## Verificación

```powershell
npm run dashboard:test
```

Las pruebas usan archivos temporales. Verifican el plan real, dependencias, cierre con evidencia, persistencia tras reinicio, edición concurrente, errores de fuente y límites HTTP. No modifican el avance del proyecto. `PLAN_V_DASHBOARD_STATE` permite levantar una instancia de QA con un archivo de estado temporal independiente.

## Diseño

Inspiración: el [reel compartido](https://www.instagram.com/reel/DdQZJiSxLzT/), con tablero oscuro, indicadores y filas densas de seguimiento. Instagram permitió observar parcialmente el reproductor; no se afirma una réplica exacta del video. Adaptación a Plan V: fondo petróleo `#11191d`, superficies `#192328`, verde salvia `#acd2b1`, acento agua `#75c6ba`, texto `#edf3ef` y ámbar `#eac387`. Poppins local para interfaz y títulos; monoespaciada para IDs y cantidades. El recorrido de siete hitos y la barra de 39 segmentos representan el plan real. Diseño adaptable y movimiento reducido respetado.
