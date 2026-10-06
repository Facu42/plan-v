# Plan alimentario y revisión de IA

El módulo Planes reúne propuestas del consultorio y el editor fechado del paciente. La ficha muestra alergias, restricciones y permisos vigentes antes del editor. Los borradores y el plan publicado siguen separados; las estimaciones conservan su procedencia y etiqueta.

El enlace de una propuesta abre su identificador exacto al recargar. Si no está lista, se informa el estado en lugar de aplicar otra. El editor distingue contenido guardado de condición de publicación: un plan publicado sin cambios está limpio, pero no se aprueba de nuevo como propuesta. Aplicar una propuesta, guardar y publicar conserva las comprobaciones existentes de consentimiento, contexto, alergias, restricciones y versión. El plan publicado se conserva si una acción falla.

Gstack comprobó un borrador manual, publicación y lectura del mismo texto desde el paciente. Luego generó IA demo, abrió su borrador, corrigió todas las indicaciones incompletas, guardó, publicó y confirmó la misma corrección en la lectura paciente. Es un recorrido ficticio sin proveedor pago. La suite incluye los casos existentes de proveedor caído, consentimiento retirado, edición concurrente y reintentos.

Validación local final del conjunto: 1388 pruebas aprobadas y 2 omitidas; tipos y compilación aprobados. Regresión añadida: un contenido publicado coincide con el formulario limpio, pero no coincide con una propuesta aprobable. Revisión independiente de código y evidencia sin bloqueo. Las sesiones firmadas y persistencia nativa quedan a cargo de CI.
