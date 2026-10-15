# Revisión independiente de navegador · entrega 7 Operaciones

15/10/2026. Revisor reality-checker, distinto del autor. Worktree `nutridesk-release-operaciones`, candidato congelado sobre d82c590db47f2acd83a35967ecb8cff0f3b46137; operaciones y corrección de correo aún sin commit al recorrer. Asociar este informe al commit posterior sólo si el autor confirma igualdad de los archivos de aplicación.

**Resultado: sin P1/P2 abiertos en el alcance local recorrido. El P2 de consentimiento de correo quedó reproducido, corregido por el autor y vuelto a comprobar.** No es una aprobación de producción ni de entrega externa.

## Entorno y método

gstack /browse y /qa-only, sin leer código de producto ni modificarlo. Datos ficticios de demostración en memoria. API propia 3023, Vite5193, APP_MODE demo, AI_MODE disabled, proveedor y credenciales remotas ausentes. Navegador a1440×1000 y390×844. Sin tablet, comparación con Figma, porcentaje de fidelidad ni cobertura inventada. Capturas abiertas y revisadas individualmente.

Primera pasada: asistente, fuentes, CSV, ayuda, configuración, comunicaciones, preferencias y error/recuperación. Tras localizar el permiso de correo ausente, el autor cambió la aplicación. Segunda pasada sobre el nuevo congelamiento: permiso de correo, regresiones de WhatsApp/diálogo y error/recuperación. La primera suite global informada por el autor es histórica; el autor mantiene evidencia y suite global nuevas por separado.

## P2 corregido: permiso de correo accesible

Reproducción anterior: paciente → Mi ficha → Mis datos y permisos sólo mostraba WhatsApp; el profesional tenía difusiones por correo pero no existía un acceso visible para que la paciente diera ese permiso. Evidencia anterior preferences-desktop.png y preferences-mobile.png, descrita en qa-report-pre-email-fix.md.

Revisión de la corrección a1440/390:

1. El diálogo Tus datos muestra Mis avisos por correo, separado de WhatsApp. La casilla inicial aparece desmarcada.
2. Marcar y Guardar permiso de correo solicita PUT notification-preferences200 y muestra Guardamos tu permiso de correo. Cerrar y volver a abrir conserva la casilla marcada.
3. Desmarcar y guardar muestra Retiraste tu permiso de correo. Los envíos pendientes vuelven a comprobar esta elección. Cerrar y abrir conserva el estado desmarcado.
4. Marcar y cerrar sin guardar conserva el valor anterior al reabrir: no hay autorización implícita por cambiar una casilla.
5. Repetí activación, guardado y reapertura en móvil; baja y guardado también en escritorio. No hubo envío externo.
6. La explicación dice que guardar una elección no activa el servicio; modo demo sólo conserva una elección de prueba. WhatsApp continúa deshabilitado y su aviso demo sigue visible, independiente de correo.
7. Detuve exclusivamente mi servidor3023: guardar presenta alerta específica y conserva la selección para reintentar, sin confirmación falsa. Al cerrar/abrir con el servidor apagado, casilla y guardar quedan deshabilitados, mensaje de carga fallida y botón Reintentar permiso de correo. Reintentar sin servidor conserva el error. Se inspeccionó a1440/390.
8. Reinicié mi servidor demo, Reintentar recupera GET200 y habilita la casilla. Guardar vuelve a PUT200 y muestra estado correcto; cerrar/reabrir recupera ambas secciones y elimina el error de WhatsApp cargado durante la parada. Consola final, tras limpiar los fallos inducidos, sin errores.

La demostración en memoria se reinicia al reiniciar el servidor. Esto no prueba persistencia hospedada, baja mediante enlace real, ni entrega de correo.

## Otros recorridos comprobados

| Recorrido | Resultado observado |
|---|---|
| Asistente local | Resumen de3 pacientes,36 comidas,5 pendientes a30 días. Pregunta vacía deja Consultar deshabilitado. |
| Fuentes | Desplegable3: Sofía14 registros/4 pendientes, Marina7/1, Lucía15/0. Botón de fuente abre ficha alimentaria correcta. |
| Indicadores CSV | Descarga real de Chromium de182bytes con cabecera y3 filas, mismos valores que fuentes. SHA256 479B54697C812E2E905E73A3F12670E337A2917970E6D13420199EEF2519F23A. |
| Período | Guardar7 días en Configuración y reportes; asistente vuelve a cargar7 días y responde para ese período. |
| Sin registros | Respuesta0 de3, fuentes0 y explicación de que ausencia de registros no prueba incumplimiento. |
| Propuestas IA | Con3 pacientes sin permiso conserva indicadores, informa mínimo5 y3 excluidas. No se habilitó ningún proveedor. |
| Ayuda |8 guías; búsqueda sin resultado muestra vacío claro, WhatsApp filtra1 y permite abrir guía/apartado. |
| Comunicaciones demo | Avisos de bloqueo para WhatsApp/correo, plantilla/revisión deshabilitadas, destinatarias sin consentimiento deshabilitadas y resultados vacíos explícitos. Selector de mensaje modifica título/texto. |
| Asistente sin API | Dos intentos muestran error genérico sin éxito aparente; reinicio y mismo botón recuperan200/resumen/fuentes y eliminan alerta. |
| Móvil | Contenido y controles observados legibles; scrollWidth390=innerWidth390 en comunicaciones/asistente. Diálogo de preferencias desplaza internamente y permite acciones. |

El CSV provino de la descarga automática del navegador a20:38:01, TEMP/playwright-artifacts-lkJXq3/90e736d5-571a-4979-8272-5ab7b1967350. Copia privada indicators-browser-download.csv, sólo datos ficticios. No adjuntar descargas de pacientes reales a PR.

## Restricción correcta y límites

- Sofía demo tiene Consentimiento de atención No vigente e ingreso borrador. /consultations/completions devuelve403 y texto que pide permiso Relación de atención; cabecera Consultas realizadas muestra No disponible. Fuente abre ficha igualmente. ROOT y autor confirmaron que es restricción esperada; no se concedió permiso para ocultarla.
- Los fallos de consola observados fueron ese403 y500 inducidos al detener el servidor local. Sin excepciones JavaScript observadas. Tras recuperación del permiso nuevo y limpieza de consola, sin nuevos errores.
- La carga rápida no permitió comprobar visualmente todos los indicadores transitorios: no se acredita esa parte de forma global.
- No se comprobaron envío real, webhook, persistencia remota, RLS con identidades reales, consentimiento por enlace de email, WhatsApp oficial ni IA externa. Permanecen apagados y fuera del recorrido. Las pruebas de servidor y la revisión de código son evidencia separada del autor/ROOT.
- Ningún cambio de aplicación, migración, proveedor, archivo Nutrigo ni índice Git fue realizado por este revisor. El autor debe anexar su comprobación de igualdad de bytes al commit final.

## Evidencia visual

Carpeta local: C:/Users/facun/AppData/Local/Temp/planv-ops7-qa-20261015.

Corrección: email-permission-default-desktop.png, email-permission-saved-desktop.png, email-permission-saved-mobile.png, email-permission-revoked-mobile.png, email-permission-revoked-desktop.png, email-permission-save-error-mobile.png, email-permission-load-error-mobile.png, email-permission-load-error-desktop.png, email-permission-recovered-desktop.png.

Primera pasada: assistant-desktop.png, help-empty-desktop.png, communications-desktop.png, communications-mobile.png, email-mobile.png, assistant-mobile.png, assistant-disabled-ai-mobile.png, preferences-mobile.png, preferences-desktop.png, demo-no-care-consent-desktop.png, assistant-api-error-desktop.png, assistant-api-error-mobile.png, assistant-api-recovered-mobile.png.

22 capturas en total, todas abiertas para inspección. Copia ignorada en .gstack/qa-reports; el autor puede integrar este texto en su documentación propia. Transporte externo sigue pendiente de configuración y validación autorizadas.
