# Entrega 7: operaciones y comunicaciones — 15/10/2026

Fuente: `b7271953a6545cde367481a093e43e68ef4d5895`. Padre: `d82c590db47f2acd83a35967ecb8cff0f3b46137` (PR123). Esta entrega conserva las mejoras de `main` hasta `9c56854`; no incorpora SARA 2, que corresponde a la entrega siguiente.

Cierre local posterior a las correcciones: **2.977 pruebas aprobadas, cero fallos, dos omitidas; QA independiente a 1440/390 y 1.789 huellas sin cambios**. PR y publicación son pasos separados.

## Estado y alcance vigentes

Se conectan el asistente de cartera, indicadores con fuentes y CSV, ayuda y configuración, preferencias de contacto, recordatorios y difusiones operativas por correo o WhatsApp oficial. La cola conserva resultados individuales y separa aceptación del proveedor de entrega confirmada. Ningún canal se activa por tener credenciales presentes.

El asistente responde localmente sobre comidas, pendientes y ausencia de registros. La pregunta libre permanece en Plan V. Las propuestas externas reciben sólo seis agregados de al menos cinco pacientes con permisos de atención y seguimiento IA vigentes; no reciben nombres, identificadores, mensajes ni notas clínicas. Groq requiere verificación explícita de retención cero y del modo gratuito. El modo pago comparte la reserva atómica de USD 5 mensuales de toda la IA nueva, sin otro proveedor de respaldo. El consumo incierto no se reenvía automáticamente.

`POST /api/portfolio/assistant` acepta `{question, days, use_ai, request_id?}`. La interfaz usa un UUID estable al pedir propuestas con IA; sin `request_id` devuelve indicadores locales y aviso, sin llamar al proveedor. Cambiar la pregunta requiere una solicitud nueva. Se revalidan asignación, fuentes y permisos antes y después del procesamiento.

Las difusiones usan plantillas estáticas revisadas y hasta cien destinatarios. Correo y WhatsApp conservan preferencias separadas, revalidación previa al envío, baja y registro de resultados. Las difusiones WhatsApp se despachan por destinatario; los recordatorios y correos habilitados usan una sola cola persistente. Un envío incierto queda para revisión. Los enlaces de baja se guardan como hash; GET muestra confirmación y POST consume el permiso, sin identificar cuentas públicamente.

## Composición comprobada

La copia inicial comprendió 57 archivos de aplicación y 8 documentos desde objetos Git de la fuente congelada. El cierre posterior repara cuatro archivos respecto de CORE: proveedor de WhatsApp y su prueba, y privacidad de la paciente y su prueba. Añade los dos archivos de `EmailPreferences`. Se conservan cinco excepciones heredadas: los dos archivos de estado demo con autorización de importación externa y los tres del recorrido de navegador con pacing comprobado contra el limitador real. También se conserva su informe. El test adicional de integración de OCR mantiene las restricciones CSP y ahora comprueba las rutas de operaciones.

La comparación vigente registra 1.786 archivos de aplicación en la fuente y 1.789 en destino: cinco diferencias heredadas, cuatro reparaciones propias y tres archivos adicionales conocidos (control de correo, prueba y wiring), sin faltantes. Los 25 JSON originales permanecen intactos. Los conteos de copias iniciales describen aquella operación, no afirman igualdad final de los archivos corregidos.

## Correcciones detectadas durante la verificación

La pantalla real de privacidad no ofrecía el permiso de correo. Una prueba de su consumidor reprodujo la ausencia antes de incorporar el control. Ahora carga inicialmente apagado y bloqueado, permite aceptar o retirar el correo de forma explícita y conserva los avisos internos y push mediante una lectura fresca antes de guardar. Los fallos de carga y guardado no producen éxito falso ni afectan WhatsApp; cerrar la pantalla impide un guardado tardío y dos pulsaciones no duplican la solicitud. En demo se registra una elección ficticia, con aviso, sin enviar mensajes. Nueve pruebas del control y las dos del montaje real cubren estos comportamientos.

WhatsApp también podía declararse habilitado sin la firma y el token necesarios para tramitar bajas. Se reprodujo el fallo de configuración parcial y se cerró: faltando cualquiera de ellos no se realiza ninguna llamada de envío. La preparación de metadatos puede permanecer disponible con envío deshabilitado. Una configuración completa conserva el recorrido simulado; no se activó el proveedor real.

Las únicas migraciones nuevas de esta entrega son `20261012120000_ops_capabilities.sql` y `20261012123000_communications_channels.sql`. El paquete completo conserva 17 pendientes y tres de base ya aplicada, con versiones y alias separados: 20 archivos locales comprobados. Validar el manifiesto no ejecuta SQL ni autoriza volver a aplicar la base.

## Verificación de esta entrega

- RED de integración: el consumidor de rutas falló antes de copiar el runtime de operaciones.
- Focal propio final: 214 pruebas aprobadas, cero fallos en 28 archivos. Los 196 casos iniciales preceden a las correcciones posteriores.
- Fire del trabajador real: desconectar su llamada de comunicaciones causó tres fallos. Restaurar exactamente los bytes dejó cuatro pruebas de trabajador e integración aprobadas.
- Suite completa propia final: **2.977 aprobadas, cero fallos y dos omitidas en 452 archivos**. Ejecución posterior a ambas correcciones sobre bytes congelados del 15/10, 23:48:43–23:52:19 UTC. El resultado anterior de 2.966 casos queda histórico; no se atribuye a esta entrega la suite de CORE.
- Tipos, compilación final (7,32 s), migraciones, manifiesto 17+3, vistas y límites de secretos aprobados después de las correcciones. La instalación y auditoría anteriores informaron cero vulnerabilidades; estas correcciones no alteraron dependencias.
- Escaneos sin hallazgos: fuente final 47,05 MB; historia inalterada de 577 commits y 80,29 MB; objetos grandes 54,94 MB. Canario y controles del scanner repetidos y aprobados. Los informes privados permanecen en TEMP.
- Comparaciones posteriores a la suite y al recorrido: 1.789 huellas exactas en ambas, cero cambios, extras ni faltantes.
- [QA visual independiente](nutridesk-release-operaciones-qa-2026-10-15.md) aprobada a 1440/390, con 22 capturas inspeccionadas: asistente, fuentes, CSV descargado y contrastado, ayuda, configuración, comunicaciones y preferencias. Tras la corrección se repitieron activación, baja y reapertura del correo, cambio sin guardar, errores de carga/guardado y recuperación. WhatsApp conservó su bloqueo demo independiente. Sin P1/P2 abiertos en este alcance. Los estados transitorios demasiado rápidos y servicios reales no se acreditan visualmente.

La [revisión independiente de ROOT](nutridesk-release-operaciones-review-2026-10-15.md) leyó rutas, trabajador, SQL de canales, transporte, cartera, presupuesto y correcciones; no dejó P1/P2 pendientes. Ejecutó 68 pruebas iniciales en doce archivos y, después de los dos cierres, 124 en siete archivos y dos del montaje real, todas aprobadas. Revisó la composición final con sus excepciones y reparaciones explícitas. Sus conteos no se suman entre sí ni a la suite global.

## Límites y habilitación

No se enviaron mensajes reales, ni se ejecutó Groq, OAuth, Mercado Pago o SQL remoto. Las dos pruebas omitidas son las de lectura/escritura RLS A/B con JWT externo; la suite local no acredita esa conexión externa. El correo operativo permanece desactivado; los correos de acceso continúan en Supabase, con las limitaciones previamente comprobadas del envío incluido. Configurar un transporte propio queda para después, según la decisión de Facundo. WhatsApp y otros servicios pagos requieren activación autorizada por separado.

Este documento sustituye las afirmaciones de estado del informe histórico del 12/10. No se realizó merge a `main`, publicación ni modificación de configuración de producción.

## Regression Guard, pasos 1–10

1. Flujos críticos: indicadores, propuestas revisables, preferencias, baja, cola y alcance por consultorio cubiertos por los focales; entrega real externa pendiente.
2. Regresiones: reintentos inciertos, permisos retirados durante el envío, privacidad del proveedor, presupuesto concurrente y conservación de los demás trabajos del worker.
3. Contratos: DTO estrictos, UUID estable de solicitud, fuentes agregadas, preferencias por canal, hashes de plantilla y tokens de ejecución.
4. Acoplamiento: una cola para comunicaciones; conserva consultas, importación, agenda, portadas y eliminación de audio privado.
5. Migraciones: dos adiciones; se preservan datos y estados al desactivar los canales. Ninguna operación remota.
6. Verificación: suite propia final 2.977/0/2 en 452 archivos, tipos, build, integridad, vistas, límites de secretos, escaneos y auditoría aprobados. No se midió cobertura porcentual.
7. Áreas frágiles: aceptación externa antes de un timeout, revocación concurrente y límites del recorrido de prueba; se conservan incertidumbre, comprobaciones actuales y pacing real.
8. Fire: tres fallos al desconectar el consumidor real; restauración comprobada y cuatro pruebas verdes.
9. Automatización: reservas persistentes, vencimientos, baja y validación de integridad en CI; servicios apagados hasta activación explícita.
10. Veredicto: SHIP para revisión del PR borrador, con suite, QA independiente, revisión de código y huellas aprobadas; HOLD de producción hasta configuración, pruebas externas y autorización correspondientes. Este informe no autoriza producción.
