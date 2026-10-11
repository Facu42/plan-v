# Consulta en curso: paciente y profesional

Hallazgo 3 de la auditoría del hilo paciente: al empezar la consulta, la lectura buscaba únicamente turnos futuros y perdía el enlace. La prueba PostgreSQL reprodujo el problema antes del cambio.

## Referencia y alcance

Se volvió a consultar el video de Nutriboost: navegación de Agenda y ficha visibles; no se observa una regla que determine cuándo desaparece un turno en curso. La corrección responde al recorrido de Plan V: una consulta programada permanece vigente desde su inicio hasta su hora de finalización. No cambia el diseño Nutrigo ni agrega pantallas. No modifica confirmaciones ni políticas de reprogramación.

## Implementación

La lectura compartida de la base considera inicio más duración. También se corrigieron la lectura individual de respaldo y el resumen de la lista profesional: buscan posibles consultas en curso dentro de los 180 minutos máximos del contrato y descartan las ya terminadas antes de elegir. El modo demo ya conservaba la consulta hasta su fin.

Se mantienen los permisos. Una consulta finalizada deja de aparecer como vigente, y su historial permanece. No se agrega actualización automática de una pantalla ya abierta.

## Verificación

- PostgreSQL temporal: enlace disponible para paciente y profesional durante la consulta, acceso ajeno denegado y ausencia al terminar.
- Lecturas del servidor: turno anterior terminado descartado, consulta en curso conservada en ficha y lista. Reloj de pruebas explícito para que las fechas de ejemplo no caduquen.
- Límite exacto de fin y duración máxima de tres horas verificados.
- Suite general: 308 archivos, 2.144 aprobadas y 2 omitidas. Prueba adicional de límites: cuatro pruebas del módulo aprobadas. Tipos, compilación, migraciones y secretos aprobados.
- Revisión de código y realidad sin bloqueantes. Recorrido firmado ampliado con enlace tras recarga y retiro al finalizar; CI pendiente al preparar el PR. El horario ficticio se restaura en `finally`.

Migración `20261008230000_appointment_in_progress.sql` preparada; sin producción.
