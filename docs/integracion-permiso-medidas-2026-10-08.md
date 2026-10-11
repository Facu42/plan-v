# Integración del permiso de medidas

## Alcance

Hallazgo 5 del relevamiento de producto del hilo paciente: el retiro del permiso de medidas no protegía las lecturas de `care_records`. Se reproduce primero con una prueba de API: el peso seguía apareciendo tras retirar el consentimiento.

Contraste visual repetido con Nutriboost (Loom 35b428b996314f9c8f5505de4a6297cb, alrededor de 1:26): historial de peso, gráfico y registro de fecha/valor/unidad. El video no demuestra una política de retiro de permisos. Este cambio aplica el contrato de privacidad de Plan V; conserva el diseño Nutrigo y no agrega campos ni pantallas.

## Cambio

- Peso, cintura y cadera dejan de aparecer en la lectura del paciente y de la profesional al retirar el permiso vigente. Las alertas tampoco los exponen y no pueden marcarse como revisados.
- La base protege las lecturas directas por usuario autenticado además de la API. Se mantiene el aislamiento y la restricción de pagos.
- El historial no se elimina. Renovar el permiso permite acceder a los mismos registros. Actividad y otros registros conservan sus permisos actuales.

## Verificación

ECC: prueba inicial fallida, implementación mínima y revisión de código/realidad sin bloqueantes. Suite general: 308 archivos, 2.142 aprobadas y 2 omitidas. Ampliación posterior de la prueba a cintura/cadera y actividad: 23 pruebas específicas aprobadas. Tipos, compilación, migraciones y secretos aprobados.

PostgreSQL temporal comprueba lecturas directas de paciente y profesional, cuentas ajenas, retiro, revisión denegada y renovación sin pérdida. Se amplió el recorrido firmado de navegador para retirar y renovar el permiso desde el control existente; su resultado final de CI se registra al completarse.

Migración `20261008223000_measurement_consent_reads.sql` preparada. Sin aplicar a producción. No se modificaron archivos de interfaz del hilo paciente ni se integró su rama. Los datos ya descargados en una sesión pueden permanecer en pantalla hasta la siguiente actualización; este cambio cierra las lecturas nuevas, no incorpora tiempo real.
