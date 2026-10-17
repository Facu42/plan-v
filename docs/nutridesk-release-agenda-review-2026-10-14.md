# Revisión independiente de entrega 6 — 14/10/2026

Actualización de integración 15/10: el restaurador comprobó las 65 copias del respaldo, preservando la ampliación de main en contratos/cliente. Las únicas diferencias canónicas esperadas respecto del respaldo son documentación y la unión de esos contratos. Root comprobó las huellas de aplicación antes de incorporar la cabeza final de la ficha. Suite propia 2.861/0/2 omitidas; tipos/build/migraciones/vistas/secretos aprobados. El código de agenda no cambió respecto de la revisión independiente previa; no se atribuyen conexiones o pagos reales a estas pruebas.

Revisor: finalize_import_release. Worktree nutridesk-release-agenda; base 66ed0390df888d5b8d44aa9df6de965f9fbd1b2d. Código propio de entrega6 no editado por el revisor. Comparación fuente congelada CORE eeeb02e08e09455247ae4ef17c95b56cec9edd9b.

Veredicto: sin hallazgos P1/P2 pendientes en el alcance revisado. Las 42 copias de la receta coinciden con CORE final normalizando únicamente CRLF/LF. Wrappers incorporan los endpoints de agenda y equipo sin habilitar portfolio/comunicaciones7. Se mantienen OCR local/CSP y la cola de recordatorios previa.

Revisión de permisos: el prefijo público exige /api/public/scheduling/; agenda privada, equipo y prefijos similares requieren autenticación. Los cambios de reservas reciben límites sensibles. Recepción usa membresía de consultorio, proyecciones de contacto y RPC operativos; no obtiene clínica ni credenciales. Compartir clínica exige asignación y organización habilitada; cada página revalida autorización y las notas usan cursor de versión. Revocar/escribir nota adquieren paciente y asignación en el mismo orden y revalidan tras el bloqueo.

OAuth/credenciales: rutas del cliente de agenda al mismo origen; PKCE, cookie HttpOnly/Lax y hashes de estado/cookie con consumo CAS. Cifrado AES-GCM con AAD del consultorio/proveedor. Tombstones/épocas y leases impiden resurrección tras desconexión y renovación concurrente. Los proveedores y destinos son fijos.

Cobros: checkout congela receptor/importe/moneda y reserva intención única antes de proveedor. Webhook HMAC y consulta real del proveedor; valida ID, collector, moneda, importe y referencia antes del RPC. RPC restringido a servicio, pago/reembolso idempotente y rechazadas cuentas/importes/monedas distintos. Preferencias inciertas sólo se recuperan con una coincidencia verificable; no se crean de nuevo automáticamente.

Google: trabajos persistentes por revisión/token/lease, guard antes de escritura, autorización fresca de perfil/paciente/época. ETag y marcador de evento, destino Calendar validado. Una escritura posiblemente emitida queda uncertain sin reenvío automático. Revisión explícita usa prueba HMAC breve ligada a evidencia remota, consultorio, revisión y época y vuelve a leer antes de confirmar.

Evidencia propia: 54 PASS, 0 FAIL, 0 omitidas en 11 archivos; JSON planv-release6-independent-review-20261014.json. Complemento wrappers/grants/worker: 91 PASS, 0 FAIL, 0 omitidas en 4 archivos; JSON planv-release6-independent-wrappers-20261014.json. No se reutilizan ni suman al full del autor. No full repetido.

Límites: PGlite y mocks locales; estas pruebas no confirman sesiones concurrentes PostgreSQL nativo, cookies de despliegue, aceptación OAuth real, pagos reales, correo entregado ni producción. ROOT revisa además UI y contratos proveedores. Sin llamadas externas, commit, push, migraciones remotas ni cambios fuente.
