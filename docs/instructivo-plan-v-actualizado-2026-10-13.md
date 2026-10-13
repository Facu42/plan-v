# Plan V: guía de las funciones nuevas

Actualizada el 13/10/2026 sobre la implementación revisada. Estas funciones todavía no están publicadas. El instructivo original de Descargas se conserva como referencia; el estado comprobado está en [el informe de integración](nutridesk-integracion-2026-10-13.md).

## Correos de acceso

Supabase gestiona confirmación de cuenta, invitación y recuperación de contraseña. Para enviar desde Plan V se eligió el Gmail `planv.nutricion@gmail.com`. Entrá con esa cuenta en [Contraseñas de aplicación de Google](https://myaccount.google.com/apppasswords), creá una llamada «Plan V» y guardá la clave de dieciséis letras en `SMTP_PASSWORD` del archivo privado `C:\Users\facun\.config\plan-v\services.env`. Requiere verificación en dos pasos. No reemplaza la contraseña habitual ni debe pegarse en el chat. La entrega real queda pendiente hasta configurar SMTP y probar un correo autorizado.

## Ficha de cada paciente

Abrí Pacientes → Ficha. Además de Resumen y los accesos a Planificación, Consultas y Cobros, están Historia clínica, Evolución, Notas de consulta, Plan actual, Plan semanal, Lista de compras, Registro alimentario, Chat, Archivos y Laboratorio. «Editar datos de ficha» permite guardar contacto, incluido teléfono. Una asistencia confirmada no cuenta como consulta realizada: la profesional confirma o corrige ese registro por separado y queda en el historial.

## Notas y videollamadas

En Notas de consulta podés crear una nota manual o cargar una transcripción TXT sin IA. Para grabar o procesar audio, la paciente debe aceptar específicamente Grabación de consultas y Transcripción y resumen con IA. Los permisos anteriores no los habilitan.

En Chrome o Edge de escritorio, seleccioná la pestaña de Meet/Zoom y activá «Compartir audio». Comprobá por separado los indicadores del micrófono y de la pestaña. Sólo se guarda audio; si falta una fuente, se interrumpe o falla un segmento, queda marcado como incompleto. En otros dispositivos podés cargar una grabación o el texto. El audio se elimina automáticamente a los siete días.

La transcripción y el borrador son privados. Revisá y corregí el texto que vas a compartir, y publicalo expresamente en el campo separado. Editar o regenerar el borrador no modifica la versión ya compartida. Groq se usa para transcribir y preparar resúmenes; no envía correos. Su activación requiere comprobar retención cero y cuenta gratuita. El uso pago nuevo está limitado globalmente a USD 5 por mes; al agotarse quedan disponibles notas manuales y lectura local.

## Importación de fichas

En Pacientes → Importar pacientes, elegí CSV, XLSX, DOCX, PDF, JPG o PNG. Convertí antes XLS o DOC. La lectura y el reconocimiento de escaneos se hacen localmente. Máximo inicial: cien pacientes, veinte archivos; veinte MB y cuarenta páginas por documento.

Asociá columnas y revisá cada fila: nombre, contacto, correspondencia con una ficha existente, fechas, unidades y origen. Elegí crear, incorporar o descartar. Los datos actuales no se reemplazan automáticamente y los planes históricos no se publican. Podés retomar sólo los resultados pendientes; para recuperar contenido clínico no confirmado se vuelve a leer el archivo original. Crear una ficha no crea una cuenta ni envía una invitación.

La organización con IA es opcional y requiere paciente vinculada, permisos de atención e IA documental y revisión previa de la fila. Propone categorías y encabezados; conservá y comprobá el texto y su fuente antes de guardar.

## Planes, estudios y documentos

La fórmula y sus referencias deben validarse antes de habilitarlas. Podés personalizar momentos de comidas, usar intercambios/grupos y revisar micronutrientes. Los documentos PDF descargables usan logo y contacto del consultorio y los datos seleccionados. Laboratorio permite revisar valores, unidades, rangos y documento original. Comparaciones segmentales, seguimiento bariátrico y resultados Kerr declarados conservan datos originales; el cálculo automático Kerr sigue pendiente de fuente primaria y validación profesional.

## Agenda, equipo y comunicación

La página pública del consultorio permite solicitar, reprogramar y cancelar con las condiciones mostradas; el consultorio confirma las solicitudes. Recepción entra por `/equipo` y gestiona contacto, agenda y cobros sin acceso clínico. Compartir ingreso y notas entre profesionales exige asignación explícita.

Google/Meet, Mercado Pago por profesional y WhatsApp oficial necesitan configuración y pruebas propias. Un cobro sólo se confirma con proveedor y webhook, nunca por volver a la web. Si una sincronización de Google queda incierta, revisá su estado antes de autorizar otra operación. Las comunicaciones requieren preferencias y consentimiento, e incluyen baja. WhatsApp y otros servicios tienen costos separados y están desactivados por defecto.

## Antes de publicar

Faltan SMTP real, verificación de Groq, pruebas de proveedores y de ambas voces en hardware, fuente Kerr validada y autorización de migraciones/configuración/publicación. Consultá [la lista de habilitación](deployment/nutridesk-habilitacion-2026-10-13.md). Las pruebas automatizadas aprobadas no prueban estos servicios externos.
