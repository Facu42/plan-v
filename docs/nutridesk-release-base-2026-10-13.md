# Primera entrega: acceso, cartera, teléfono, aspecto y fotos

Copia local aislada: `codex/nutridesk-release-base`, iniciada desde `origin/main` en `ae3dc30e3095d4856e3a5055fdeca5ebcf2424e3`. Primera entrega preparada para revisión en PR; se preservó la copia integrada y las demás ramas. Sin cambios de producción. Las siguientes entregas dependerán de esta cabeza revisada y no deben publicarse por separado sin comprobar sus migraciones y configuración.

## Cambios incluidos

- Confirmación, invitación y recuperación de acceso mediante Supabase Auth. El configurador admite SMTP Gmail con contraseña de aplicación o Brevo con remitente verificado. Su modo predeterminado comprueba; sólo `--apply` cambia configuración, con autorización específica del operador. Conserva destinos existentes de los enlaces y verifica la configuración guardada; no afirma entrega en la bandeja de entrada.
- La recuperación conserva una respuesta pública genérica y registra resultados operativos sin direcciones, enlaces secretos ni texto clínico. Las invitaciones de acceso dejan de elegir otro proveedor en función de una clave Brevo disponible.
- La cartera, los mensajes pendientes, los avisos y los historiales existentes se recorren por páginas. Se conserva el alcance del actor y los permisos vigentes. Los recordatorios existentes verifican opt-in de correo, relación de atención, cuenta activa y asignación antes de preparar y enviar.
- Identidad neutral del copiloto y del nombre profesional de respaldo. Sus propuestas requieren revisión; esta entrega no incorpora el asistente global.
- Teléfono opcional en la ficha y su editor, con máximo de cuarenta caracteres, lectura profesional y políticas existentes de pertenencia. Nueva migración: `20261011141000_patient_phone.sql`.
- El consultorio usa los tokens y contrastes de Nutrigo. Las fotos de ingredientes se conectan a las piezas originales del archivo, conservando el número y las cantidades y rechazando direcciones privadas o inseguras. Los archivos fuente JSON de Figma permanecen sin modificaciones.

## Separación de las entregas posteriores

No se incorporaron módulos nuevos de consultas, presupuesto/proveedor clínico, importación, organización documental, ficha ampliada, nutrición avanzada, clínica avanzada, equipo, agenda pública ni comunicaciones masivas. El índice de la API conserva sólo las rutas de la base más los cambios de acceso. El editor conserva el teléfono sin botones ni dependencias de importación.

`package.json`, `package-lock.json`, CI, Vercel y el worker son los de `origin/main`. No se agregaron preparadores de OCR/PDF, manifiesto final de quince migraciones ni dependencias de apartados posteriores. Se instalaron dependencias propias mediante `npm ci --ignore-scripts`; `node_modules` es un directorio normal, sin enlace ni junction. El transporte operativo Gmail y la nueva cola de comunicaciones corresponden a una entrega posterior; los recordatorios actuales conservan su transporte Brevo existente y no se activan sin configuración. SMTP de Supabase Auth es independiente de ese transporte.

El usuario pospuso Gmail porque esa cuenta pertenece a su cliente. Se conserva Supabase Auth; su envío incluido sólo admite destinatarios miembros del equipo del proyecto y actualmente dos mensajes por hora, sin entrega a pacientes externos. Un remitente central propio queda para después; no se solicita la contraseña personal de cada cliente. [Restricciones oficiales de Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

Las credenciales no están en esta copia. El configurador SMTP queda opcional; habilitar un proveedor propio requiere configuración de Auth y una prueba de recepción y cambio efectivo de contraseña. Esta revisión no aplicó migraciones, no modificó Auth remoto ni llamó proveedores de IA o mensajería reales.

## Pruebas previas e independencia

Se conservaron los casos finales de recuperación/configurador, carteras grandes, identidad, teléfono, fotos, contraste y consentimiento. La secuencia de pruebas primero está en el historial de integración: `e6edb36` (cartera, identidad y recuperación), `ff92b86` (contraste), `b114443` (teléfono) y `d90f96e` (fotos y ficha); los cambios funcionales relevantes vienen de `f624f43`, `8ffd152` y `40c0a73`. La separación recupera exclusivamente los cambios de esta primera entrega cuando un archivo compartido también contenía funciones posteriores.

Se comprobó que no hay importaciones nuevas hacia los módulos posteriores en el índice, editor o entrada. No se añadieron banderas ni activaciones de conectores futuros. La suite local incluye aislamiento entre consultorios, límites de acceso de pacientes y administrador, privacidad de fotos, consentimiento y fronteras de secretos.

La revisión independiente detectó que el adaptador descartaba errores de consulta y la carga real de la interfaz cortaba en quinientos pacientes. Se añadieron pruebas del lookup de consultorio, error en la segunda página, respuestas inválidas, desempate por identificación, boot de mil pacientes, páginas vacías que anuncian más, páginas repetidas y metadatos sin avance. Antes de la corrección fallaron ocho casos; después aprobaron los sesenta y tres casos focales tanto aquí como en la copia integrada, junto con tipos y revisión de diferencias. La carga acumula páginas localmente y publica sólo al terminar; el orden por nombre e identificación sostiene el recorrido. No se reemplazó el límite anterior por otro corte silencioso.

## Regression Guard: paso 10

- Flujos críticos: acceso, recuperación e invitaciones cubiertos por contratos y proveedores simulados; recepción real de correos pendiente. Cartera de mil pacientes, pendientes, teléfono, recetas/fotos y permisos cubiertos por pruebas locales.
- Regresiones: corte a cien fichas o quinientos registros, contador parcial de mensajes, identidad fija, correo alternativo de acceso y datos operativos de bajo contraste. Las pruebas respectivas se conservaron y aprobaron.
- Contratos: cliente/API, esquemas de teléfono, proyecciones profesionales, autorización de las páginas, Supabase Auth y configuración SMTP comprobados sin depender de módulos futuros.
- Áreas frágiles: entrega externa de correo, permisos y recorridos extensos. Se mantiene respuesta pública genérica, configuración explícita, controles de opt-in y errores que no devuelven carteras parciales.
- Migración: columna de teléfono y límite aditivos, sin cambiar políticas existentes ni borrar datos. Rollback operativo: volver al código previo y conservar la columna; cualquier modificación de producción requiere su autorización y copia previa.
- Fire test: en esta copia se sustituyó temporalmente la identidad neutral por una identidad fija; `copilot-identity.test.ts` falló. Se restauraron los bytes originales y las diez pruebas focales volvieron a aprobar: veintitrés casos, cero fallos.
- Automatizaciones: el configurador comprueba por defecto y verifica lo aplicado; pruebas de secretos, migraciones, paginación, destino de enlaces, teléfono y contraste protegen la entrega.
- Verificación después de corregir el adaptador y boot real: suite completa con **2.504 pruebas aprobadas y dos omitidas, 369 archivos**; tipos de web/servidor, migraciones, secretos y diferencias sin errores aprobados. Compilación web aprobada; conserva avisos de chunks grandes y fuentes importadas estática y dinámicamente. Sin script de lint. Resultado JSON local en `%TEMP%/planv-release-base-tests.json`.
- Veredicto: lista para revisión de esta primera entrega. SMTP propio pospuesto por el usuario; el envío incluido de Supabase queda limitado a pruebas con el equipo. Producción pendiente de configuración, evidencia externa y autorización; la publicación de las cabezas intermedias no fue realizada.
