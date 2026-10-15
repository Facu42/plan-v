# Sexta entrega: agenda, reservas, equipo y cobros

**Actualización 15/10:** conciliada con main `2d31f9d`, sin perder síntomas, vistas, avisos, compras ni los recorridos heredados. Suite propia **2.861 aprobadas, cero fallos, dos omitidas; 437 archivos**; tipos, build (8,66 s), migraciones, vistas, secretos y auditoría de dependencias aprobados. Se conservaron el arreglo del permiso de menú y las reglas de cabecera clínica/gris original de CORE `bb4d794`. Nueve casos focales y scanner de fuente/historia/objetos grandes aprobados. El respaldo previo y stash `12b49e6` permanecen disponibles. Los conteos y bases del 14/10 que siguen son históricos; proveedores y pagos reales siguen sin activar.

Rama `codex/nutridesk-release-agenda`, base exacta `66ed0390df888d5b8d44aa9df6de965f9fbd1b2d` de la ficha clínica. Se separaron 42 archivos con huellas verificadas de CORE `460854a0d087001b06b3c91dfbfc8672e876d842`; coinciden también con CORE final `eeeb02e08e09455247ae4ef17c95b56cec9edd9b`. Dieciocho wrappers conservan las funciones heredadas y añaden sólo esta entrega. Sin nuevas dependencias, configuración de proveedores, aplicación de SQL hospedado, merge ni producción.

## Comportamiento

La profesional configura agendas, tipos de consulta, duración, modalidad, valores, disponibilidad semanal, bloqueos y página pública. La página solicita contacto y autorización operativa; una reserva pública queda pendiente de confirmación. Confirmar permite asociar una ficha existente o crear una ficha sin cuenta ni invitación. La profesional puede reprogramar o cancelar; el enlace privado de la visitante exige su token y conserva la regla de veinticuatro horas de anticipación para cambios públicos.

Google Calendar/Meet se configura por profesional, mediante OAuth al mismo origen de la web, PKCE y cookie privada. Las credenciales cifradas están ligadas al consultorio y proveedor. Las renovaciones y trabajos persistentes usan época, revisión y token exclusivos; una posible escritura remota sin resultado confirmado queda pendiente de revisión y no se reenvía automáticamente. La revisión vuelve a consultar el evento remoto antes de aceptar una coincidencia.

Mercado Pago conserva destinatario, importe y moneda de cada intención de cobro. La vuelta del navegador no acredita pagos: el webhook verifica firma y consulta al proveedor; el servidor comprueba receptor, referencia, moneda e importe antes del registro idempotente. Admite señas, saldo total, reportes de transferencia con revisión y conciliación. Las conexiones reales y los pagos no están activados ni se probaron contra proveedores reales en esta entrega.

Recepción gestiona contacto, turnos y cobros dentro de su membresía. No recibe archivos, transcripciones, clínica ni credenciales. Compartir clínica con otra profesional requiere asignación explícita y organización habilitada; cada página de notas revalida el acceso. Las notas compartidas se recorren por versión y no se limitan a las primeras cincuenta. Se restauraron los fixtures reales de recepción en importación y exportación histórica, ahora que existen sus tablas.

## Separación y contratos

Los únicos proxies nuevos son `/api/scheduling/:path*` y `/api/public/scheduling/:path*`, además de los destinos web `/consultorio/:path*` y `/equipo`. La autorización pública exige el prefijo exacto con barra final; el equipo y la agenda privada siguen autenticados. Las mutaciones de reserva tienen límite sensible y el token de visitante se transmite en una cabecera específica. El cliente de agenda usa el mismo origen para conservar cookies de OAuth; el cliente heredado mantiene su destino habitual.

El worker agrega sincronización de agenda y conserva las colas de consultas, organización documental, fotos y recordatorios heredados. Evita solapar un lote de agenda; un rechazo permite el próximo lote y sólo registra estado operativo. Comunicaciones y cartera de entrega 7 siguen fuera. El montaje conserva CSP/OCR local. No se modifica `package.json`, lockfile, CI, JSON fuente de Nutrigo ni el registro de producto del otro hilo. Las 25 escenas originales conservaron sus huellas.

## Migraciones

Cinco archivos nuevos, simulados localmente en orden numérico:

- `20261012100000_scheduling_and_booking.sql`.
- `20261012121000_booking_team.sql`.
- `20261012133000_team_email_invites.sql`.
- `20261012134000_scheduling_concurrency.sql`.
- `20261013110000_shared_notes_pagination.sql`.

Se agregan exactamente 25 RPC autenticadas al catálogo de permisos y once tablas internas. Renovación, épocas, fencing y recepción de pagos conservan permisos de servicio; no se amplía su acceso autenticado. La reversión consiste en retirar la funcionalidad de aplicación y conservar reservas, cobros, auditoría, asignaciones y trabajos; no borrar datos. La habilitación remota requiere revisar el paquete completo y autorización escrita. El manifiesto final corresponde a entrega 7, no se agrega uno parcial aquí.

## Regression Guard — paso 10

- Flujos críticos verificados: acceso heredado, configuración, reservas públicas, revisión profesional, asociación a paciente UUID, reprogramación, cancelación, token privado, OAuth, cobros idempotentes, recepción sin clínica, dos consultorios, asignaciones, paginación de 121 notas y retiro entre páginas. Pruebas locales y contratos de proveedor controlados; no se demuestra aceptación OAuth, entrega de correos ni cobros reales.
- Regresiones cubiertas: prefijos parecidos no abren recursos privados; la segunda reserva supera el límite configurado; estados OAuth antiguos no resucitan una conexión; refresh concurrente no pisa una cuenta reemplazada; trabajo incierto no repite escritura; receptor incorrecto y webhook duplicado no acreditan otra cuenta; notas posteriores al retiro se rechazan.
- Contratos revisados: DTO/cliente/servidor/base, origen OAuth y cookies, token de visitante, importe en unidades menores, receptor y moneda, revisión de reservas, autorización por paciente y página. La UUID real se conserva estricta; no se relajó para la demostración.
- Áreas frágiles: credenciales, pagos, autorización clínica y trabajos externos. Se mantienen cifrado, RLS, reserva exclusiva, CAS y estados inciertos. PGlite no demuestra la ejecución simultánea de dos sesiones PostgreSQL nativas ni las cookies del despliegue.
- Prueba primero: antes de montar wrappers, `scheduling-public.test.ts` tuvo una prueba aprobada y dos fallidas: el prefijo público se rechazaba y la segunda reserva respondía 200 en vez de 429. Tras el montaje, el focal propio aprobó 196 casos en 22 archivos.
- Fire test: sólo en una base PGlite desechable se reemplazó la comprobación previa a escritura de Google por aceptación incondicional. La red detectó cuatro fallos y tres casos aprobados. Sin esa modificación de prueba, los siete casos aprobaron. Ningún SQL de aplicación fue modificado para el ensayo.
- Automatizaciones: límites públicos, whitelist de funciones, cierre de tablas internas, scanner con control positivo, simulación numérica de SQL, conservación de escenas, retorno al equipo y pruebas de worker sin solapamiento.
- Gate: **2.816 pruebas aprobadas, cero fallos, dos omitidas, 431 archivos**, ejecución completa propia con dos trabajadores. Tipos, build (49,57 segundos), migraciones, vistas, secretos, escáner y auditoría aprobados. No hay lint separado ni porcentaje de cobertura medido. La primera ejecución tuvo 2.815 aprobadas y un timeout heredado de cinco segundos en persistencia de ingreso; pasó al ejecutarlo aislado y al repetir toda la suite con concurrencia limitada, sin cambiar código ni timeout. Se conserva esa evidencia y no se atribuye una causa comprobada.
- Revisión independiente: 54 casos aprobados en once archivos y 91 en cuatro archivos de wrappers/permisos/worker; sin P1/P2 pendientes. Esas cuentas no se suman a la suite del autor. [Informe independiente](nutridesk-release-agenda-review-2026-10-14.md).
- Veredicto: preparado para PR borrador y revisión. La publicación y proveedores siguen pendientes de autorización y pruebas específicas.

## Navegador local y límites

Ensayo con gstack, API 3019 y web 5189, datos ficticios, Supabase/proveedores sin claves, IA y comunicaciones desactivadas. La profesional publicó una página local; la visitante solicitó el 15/10 a las 09:00. La cancelación pública a menos de veinticuatro horas fue rechazada. La profesional confirmó creando una ficha nueva, reprogramó al 22/10 a las 09:00 y el enlace privado mostró ese estado; la cancelación pública con anticipación suficiente funcionó. No se creó cuenta, envió invitación ni procesó pago.

La selección de Sofía ficticia (`pat-sofia`) en la demostración devolvió 400 porque el contrato exige UUID real. Este límite de los identificadores demo queda explícito: no se afirma que se asoció Sofía. Los fixtures locales con UUID real sí verifican la asociación a una ficha existente. No se debilitó el contrato de producción para resolver una diferencia de la demostración.

La página pública y `/equipo` se inspeccionaron a 1440×1000 y 390×844: `scrollWidth` coincide con el ancho de cada ventana. Capturas locales ignoradas en `design/auditoria/nutridesk-release6-2026-10-14/`. El equipo en demo avisa que requiere sesión real y guardado persistente; sus permisos operativos se prueban separadamente en API y PGlite. No se declara fidelidad visual ni operación autenticada de recepción desde la UI demo.

## Evidencia reproducible

Reportes locales en `%TEMP%/planv-release6-{red-wiring,focal,fire-red,fire-green,full,full-final,intake-retry}-20261014.json`, auditoría y prueba de 42 copias `planv-release6-copy-proof-20261014.json`. La suite final comenzó el **15/10/2026 a las 00:55:06 UTC** y terminó a las **00:59:35 UTC** (14/10, 21:55–21:59 en Argentina). No cambió código de aplicación durante esa ejecución; las actualizaciones posteriores sólo registran evidencia.

Gitleaks 8.30.1: fuente final con evidencias locales 46,40 MB (primer barrido de fuente 29,32 MB), historial de 557 commits y 73,33 MB, más 54,94 MB de objetos históricos grandes fragmentados; cero hallazgos. El control sintético confirmó que una clave ficticia es detectada y la bandera desactivada permitida no dispara una falsa alarma. Sin excepciones nuevas. `npm ci --ignore-scripts --no-audit --no-fund` instaló 172 paquetes; auditoría posterior sin vulnerabilidades. Compilación con aviso habitual de módulo grande. No se consultaron secretos ni se contactaron proveedores reales.
