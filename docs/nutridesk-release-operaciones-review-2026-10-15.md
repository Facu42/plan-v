# Revisión independiente de operaciones · 15/10/2026

Revisor: ROOT. Autor: agente de entrega 7. Árbol revisado: `codex/nutridesk-release-operaciones`, padre `d82c590db47f2acd83a35967ecb8cff0f3b46137`, fuente `b7271953a6545cde367481a093e43e68ef4d5895`. Sólo lectura y pruebas propias; sin cambios de aplicación ni llamadas a proveedores.

**Sin P1/P2 pendientes en este alcance.** El código queda preparado para el PR borrador después de cerrar su suite global, control de secretos y recorrido visual independiente. No constituye autorización de publicación ni prueba de entrega de mensajes, voces de una consulta o servicios externos.

## Qué se revisó

- Las 57 copias iniciales coincidían con sus objetos Git de la fuente. El cierre conserva exactamente los dos archivos de demo con autorización documental estricta y los tres del ritmo del recorrido firmado. Cuatro reparaciones propias y dos archivos nuevos cierran los hallazgos descritos abajo; se enumeran explícitamente en la convergencia final. El test adicional de importación mantiene WASM local, CSP y OCR; sólo reemplaza la ausencia esperada de operaciones por su montaje efectivo. Los 25 JSON originales no cambian.
- El montaje conserva consultas, importación, agenda, equipo y trabajos anteriores. La nueva cola de comunicaciones reemplaza el recordatorio antiguo una sola vez, evita solapamientos y conserva errores sin datos privados. El borrado de privacidad incluye audio de consulta.
- Servidor, SQL y trabajador comprueban consultorio, destinatario, permiso y revisión antes de enviar. Las bajas usan hashes de tokens; GET muestra confirmación y POST modifica la preferencia. La excepción de origen opaco se limita al comando público exacto. Una entrega incierta no se repite automáticamente.
- El asistente conserva respuestas y fuentes locales. Groq requiere configuración y verificaciones explícitas; las propuestas usan sólo agregados autorizados de al menos cinco pacientes. La reserva y el consumo se contabilizan en la misma bolsa global de USD 5 de la IA nueva, sin fallback al proveedor heredado. Las propuestas no ejecutan acciones clínicas.
- La dependencia de correo es exclusiva del servidor. Se conservan los recorridos y el monitor de main; CI añade la verificación obligatoria del manifiesto. Las dos migraciones nuevas son aditivas y permanecen locales; el manifiesto diferencia 17 pendientes de tres SQL exactas ya aplicadas.

## Evidencia propia

Focal inicial: **68 aprobadas, cero fallos y cero omitidas en doce archivos.** Proveedor, autorización y rutas de cartera; presupuesto global; arranque y cierre del trabajador; comunicaciones; manifiesto; origen de la baja; transporte de correo; montaje OCR/CSP y ritmo del recorrido firmado. Transportes y datos ficticios, sin activación externa. Este conteo precede a los dos cierres posteriores.

Reporte: `%TEMP%/planv-release7-root-independent-20261015.json`. Comparación propia de copias: `%TEMP%/planv-release7-root-copy-proof-20261015.json`. La prueba de convergencia global del autor conserva cinco diferencias heredadas y el único test adicional, sin faltantes. Los conteos focales no se suman a la suite global de la entrega.

La prueba controlada del autor desconectó el trabajador de comunicaciones, obtuvo tres fallos, restauró los bytes y obtuvo cuatro casos verdes de trabajador y montaje. La revisión no repitió esa mutación mientras corrían la suite y el recorrido visual. Sus resultados globales, visuales y de secretos se registran en el informe final de entrega.

## Hallazgos posteriores cerrados

La revisión visual encontró un P2: el control de correo existente no era alcanzable desde la app actual de la paciente. El backend exigía ese permiso, pero la privacidad nueva sólo mostraba WhatsApp. ROOT pidió cerrarlo antes del PR. Ahora la pantalla real de privacidad monta `EmailPreferences`: inicia apagado y bloqueado hasta leer, permite elegir y retirar explícitamente, preserva avisos internos/push con una lectura fresca y separa sus errores de WhatsApp. Un cierre impide iniciar un guardado tardío, y dos pulsaciones no duplican el PUT. Guardar en demo es una elección ficticia; no habilita transporte ni envía correos.

ROOT encontró otro P2 de configuración: WhatsApp podía quedar marcado como activo sin las credenciales necesarias para registrar/verificar las bajas. Ahora la configuración parcial mantiene el envío bloqueado y sólo permite preparar metadatos; el envío exige tanto firma como verificación del webhook. La prueba parcial comprueba cero llamadas al proveedor, y la completa conserva el recorrido simulado aprobado.

Revisión propia posterior: **124 aprobadas, cero fallos en siete archivos**, sobre email, módulos, proveedor, comunicaciones, SQL, outbox y tablas internas. Además aprobaron los dos casos del consumidor real `ShowroomPrivacy`. Reportes `%TEMP%/planv-release7-root-email-independent-20261015.json` y `%TEMP%/planv-release7-root-privacy-mount-20261015.json`. No se suman a los conteos anteriores ni a la suite global.

La guía de React se aplicó al montaje y ciclo de vida: lectura en efecto, escritura sólo por submit, dependencias primitivas, clave por paciente y descarte de respuestas tras cerrar. Las cuatro modificaciones respecto de CORE son proveedor/prueba y privacidad/prueba; los dos archivos adicionales corresponden al control de correo. La convergencia actualizada contiene 1.786 archivos de fuente y 1.789 de destino, cinco mejoras heredadas, esos cuatro cambios y tres adicionales conocidos (correo dos, wiring uno), sin faltantes. La suite de 2.966 casos anterior al arreglo queda histórica.

ROOT verificó el JSON de la nueva suite final: **2.977 aprobadas, cero fallos y dos omitidas; 452 archivos**, posterior a ambas reparaciones. El informe pos-suite confirma las 1.789 huellas intactas. Evidencia: `%TEMP%/planv-release7-email-final-full-20261015.json` y `%TEMP%/planv-release7-email-post-full-proof-20261015.json`. El recorrido visual afectado y sus límites se registran por separado; este resultado no demuestra una entrega de correo externa.

## Límites del visto bueno

SMTP propio sigue pospuesto. Groq requiere comprobar retención cero y modalidad de costo antes de habilitarse. WhatsApp, Google y Mercado Pago requieren sus verificaciones reales y autorización correspondiente; sus costos no se activan con este PR. Kerr continúa con masas declaradas hasta contar con una fórmula y sus unidades validadas profesionalmente. SARA 2 pertenece a la entrega siguiente y no está incluida en esta revisión.
