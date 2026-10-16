# Ritmo del recorrido con sesiones firmadas · 15/10/2026

El job 116449469245 de PR107 (`11ca69f`) aprobó los 30 casos de Auth/PostgREST, pero el recorrido posterior terminó con HTTP429 en comidas/hábitos. El escenario completo alterna roles, consultas de comprobación y recargas mucho más rápido que una sesión humana. El límite público sigue siendo 300 solicitudes por IP y minuto; el indicador operativo desactivado en la pila temporal no desactiva ese límite público independiente.

El runner conserva todos los límites del servidor y espera únicamente lo que resta de su primera ventana antes de comenzar comidas/hábitos. La referencia es la confirmación de salud de su API temporal y el margen es de un segundo; las pausas individuales duran como máximo un segundo. Si el escenario ya tardó más de esa ventana, no espera. No hay cambios al código del producto, permisos, políticas, límites, claves o configuración alojada.

Regresión del helper: dos casos fallaron con un helper sin espera; al implementar la espera aprueban los tres casos (ventana restante, ya transcurrida y fracción de segundo). Las pruebas de seguridad HTTP siguen aprobando. Tipos comprobados; CI debe repetir el recorrido completo sobre la nueva cabeza. Esto no se presenta como recepción de correo ni prueba de proveedor.
