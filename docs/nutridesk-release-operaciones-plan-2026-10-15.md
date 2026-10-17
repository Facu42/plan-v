# Plan ejecutado de operaciones y comunicaciones — 15/10/2026

Fuente congelada: `b7271953a6545cde367481a093e43e68ef4d5895`. Padre confirmado: `d82c590db47f2acd83a35967ecb8cff0f3b46137` (PR123). El plan previo se guardó antes de crear el worktree; este archivo registra su ejecución.

1. Confirmar ambos commits y crear `codex/nutridesk-release-operaciones` desde el padre validado. Completado.
2. Adaptar el test heredado de integración para exigir las rutas de operaciones, manteniendo CSP, WASM, OCR local y PDF de importación. Se reprodujo un fallo antes de copiar el runtime.
3. Copiar 57 archivos de aplicación y ocho documentos desde los objetos Git de la fuente. Conservar los dos archivos de demo con autorización documental estricta, los tres del pacing mejorado y su informe. Completado con huellas verificadas.
4. Ejecutar focales y una prueba controlada del trabajador. Completado: 196 aprobadas en 24 archivos; desconectar comunicaciones produjo tres fallos, restaurar los bytes dejó cuatro casos verdes de trabajador e integración.
5. Ejecutar tipos, compilación, migraciones, manifiesto 17+3, vistas, límites de secretos, escaneo y auditoría de dependencias. Completado. Congelar la aplicación y ejecutar una suite completa propia y QA independiente a 1440/390; registrar el cierre en el informe de entrega.
6. Actualizar sólo las filas propias y la bitácora de coordinación, enlazar el estado vigente y marcar como histórico el informe anterior. Conservar referencias y trabajo de los demás agentes.
7. Comparar todos los archivos de aplicación contra la fuente y el padre. El cierre admite cinco excepciones heredadas, las cuatro reparaciones propias descritas abajo y tres archivos adicionales conocidos (wiring y control de correo con su prueba). Los 25 JSON originales se conservan. ROOT revisa antes del commit; push, PR y publicación son pasos separados.

Durante QA apareció la ausencia del permiso de correo en la app real de la paciente; ROOT detectó además la habilitación incompleta de WhatsApp sin su canal de baja. Se amplió el plan con RED en el consumidor real y en la configuración parcial, correcciones mínimas y nueve casos del control de correo más dos del proveedor. Se modificaron proveedor/prueba y privacidad/prueba respecto de CORE; se añadieron `EmailPreferences` y su prueba. Los transportes siguen apagados. La suite de 2.966 casos anterior a esos cierres queda histórica: se ejecuta otra completa y se repiten los controles visuales afectados sobre un nuevo freeze de 1.789 archivos.

Cierre comprobado: suite nueva 2.977 aprobadas, cero fallos y dos omitidas en 452 archivos; focal final 214/28, tipos, build y gates aprobados. QA independiente repetida a 1440/390, errores/recuperación incluidos; 22 capturas revisadas. Las comparaciones posteriores a suite y QA preservan las 1.789 huellas. [Informe vigente](nutridesk-release-operaciones-2026-10-15.md).

No se ejecutan SQL remoto, proveedores, pagos o modificaciones de configuración. Las tres migraciones de base ya aplicadas no se repiten. SARA 2 corresponde a la entrega 8.
