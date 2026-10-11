# Plan alimentario y revisión de IA

El módulo Planes reúne propuestas del consultorio y el editor fechado del paciente. La ficha muestra alergias, restricciones y permisos vigentes antes del editor. Los borradores y el plan publicado siguen separados; las estimaciones conservan su procedencia y etiqueta.

El enlace de una propuesta abre su identificador exacto al recargar. Si no está lista, se informa el estado en lugar de aplicar otra. El editor distingue contenido guardado de condición de publicación: un plan publicado sin cambios está limpio, pero no se aprueba de nuevo como propuesta. Aplicar una propuesta, guardar y publicar conserva las comprobaciones existentes de consentimiento, contexto, alergias, restricciones y versión. El plan publicado se conserva si una acción falla.

Gstack comprobó un borrador manual, publicación y lectura del mismo texto desde el paciente. Luego generó IA demo, abrió su borrador, corrigió todas las indicaciones incompletas, guardó, publicó y confirmó la misma corrección en la lectura paciente. Es un recorrido ficticio sin proveedor pago. La suite incluye los casos existentes de proveedor caído, consentimiento retirado, edición concurrente y reintentos.

Validación local final del conjunto: 1388 pruebas aprobadas y 2 omitidas; tipos y compilación aprobados. Regresión añadida: un contenido publicado coincide con el formulario limpio, pero no coincide con una propuesta aprobable. Revisión independiente de código y evidencia sin bloqueo. Las sesiones firmadas y persistencia nativa quedan a cargo de CI.

## Cierre del ensayo autenticado

El 6/10/2026 (UTC; 5/10 en Argentina) terminaron correctamente las comprobaciones de las cuatro entregas. Implementación completa e95d3df: 27 pruebas de sesiones firmadas y 42 confirmaciones de navegador sobre Supabase temporal. Se comprobó que reiniciar la API conserva el identificador, versión e indicación del plan y el pago confirmado; la paciente recuperó el mismo plan al recargar. Los datos ficticios y contenedores se eliminaron.

[Ejecución del conjunto completo](https://github.com/Facu42/plan-v/actions/runs/37397726321). La entrega backend separada también aprobó sus 27 pruebas y 40 confirmaciones con su interfaz base. Revisión de código y de evidencia cerradas sin bloqueos. La documentación final no cambia el código probado. La migración de aislamiento editorial continúa preparada, sin aplicar a producción.
