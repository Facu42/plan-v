# Bandeja y biblioteca del consultorio

Base revisada: origin/main c11a1c6. Trabajo aislado; las otras copias locales se conservaron.

La bandeja agrega ingresos, comidas, registros, propuestas de IA, mensajes, pagos y consultas del consultorio determinado por la sesión. Devuelve identificador, paciente, estado, fecha y destino; admite filtros y paginación. Los contadores salen del mismo conjunto autorizado y no incluyen notas ni contenido privado. Las lecturas fallan explícitamente si una fuente falla.

La biblioteca profesional puede leerse sin elegir paciente. Permite crear borradores, publicar y asignar los recursos creados. Un reintento idéntico devuelve el recurso guardado; cambiar contenido bajo el mismo identificador produce conflicto. Las nuevas versiones se crean como copias y conservan las asignaciones anteriores.

La revisión independiente encontró una política editorial demasiado amplia: se preparó la migración 20261005224500_editorial_clinic_isolation.sql. Limita el catálogo a material global o del propio consultorio, y verifica el propietario dentro de la función de asignación. Está probada con PostgreSQL temporal (PGlite); **no está aplicada a producción**.

Validación local del conjunto: 243 archivos, 1388 pruebas aprobadas y 2 omitidas de forma preexistente. Incluye más de 100 pacientes, paginación, dos consultorios, consistencia de contadores y ausencia de datos privados. Comprobaciones de tipos, compilación, migraciones y secretos se ejecutan para la entrega. Las sesiones reales firmadas se comprobarán en la pila descartable de GitHub; Docker local no tiene un servidor disponible.

Revisión de código: code-reviewer independiente, hallazgos corregidos y cierre sin nuevos defectos bloqueantes. No se modificaron servicios ni configuración de producción.

## Cierre del ensayo autenticado

El 6/10/2026 (UTC; 5/10 en Argentina) terminaron correctamente las comprobaciones de las cuatro entregas. Implementación completa e95d3df: 27 pruebas de sesiones firmadas y 42 confirmaciones de navegador sobre Supabase temporal. Se comprobó que reiniciar la API conserva el identificador, versión e indicación del plan y el pago confirmado; la paciente recuperó el mismo plan al recargar. Los datos ficticios y contenedores se eliminaron.

[Ejecución del conjunto completo](https://github.com/Facu42/plan-v/actions/runs/37397726321). La entrega backend separada también aprobó sus 27 pruebas y 40 confirmaciones con su interfaz base. Revisión de código y de evidencia cerradas sin bloqueos. La documentación final no cambia el código probado. La migración de aislamiento editorial continúa preparada, sin aplicar a producción.
