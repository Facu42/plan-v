# Revisión independiente: entrega 5 clínica

Revisión sobre la copia aislada `nutridesk-release-clinica`, base `304413fcbe3dcec9012edac1952704d7635cd218`, el 14/10/2026. No se editaron archivos de entrega 5, entrega 4 ni CORE desde esta revisión.

## Hallazgos y nueva comprobación

Se encontraron dos P2 antes del cierre, ambos corregidos por el autor:

1. El PDF usaba la marca del snapshot abierto aunque la exportación recién consultada devolviera otra marca o ninguna. El consumidor ahora valida y usa `pkg.snapshot.brand`; rechaza marca retirada/inválida y permite consultar una marca creada después de abrir la pantalla. Los cinco casos del consumidor real aprobaron por separado.
2. El callback de PDF podía descargar después del cierre o cambio de paciente; no tenía fence ni registraba trabajo ocupado en la navegación. El callback anterior se reprodujo con construcción demorada: empezó con paciente ficticia A y llamó al descargador después del cierre y selección de B. El fix invalida montaje/paciente/generación, verifica tras guardar, consultar y construir, y antes de descargar; mantiene exclusión síncrona entre clics y usa el bloqueo real de navegación. El pedido exitoso refresca después de descargar y limpiar campos, para evitar cancelar su propio trabajo. Si falla PDF, conserva el pedido y los campos, mostrando que el guardado sí ocurrió.

El rereview final no encontró P1/P2 abiertos en este alcance. La ausencia de aborto de CPU o transporte del PDF no habilita descarga tardía: los guards impiden continuar o producir el efecto después del cierre. No se afirma que el renderizado ya iniciado sea interrumpido físicamente.

## Alcance inspeccionado

- Diez secciones clínicas y cuatro accesos operativos; alias anteriores; finalización de consulta separada de confirmación de asistencia.
- Rutas, repositorio y contratos de laboratorio, segmentos, resultados Kerr declarados, bariatría, documentos, referencias, marca y pedidos.
- Dos migraciones; RLS de lectura propia, ausencia de escrituras directas, siete RPC autenticadas y helper de validación cerrado. Acceso de paciente/administrador/otro consultorio rechazado.
- Documento original, hash, archivo propio, 20 MB y árbol real PDF de hasta cuarenta páginas; limpieza de assets en conflictos/fallos.
- Consentimientos de atención/documentos/mediciones; referencia activa/aprobada del profesional; registro inmutable e idempotencia/conflictos; notas privadas seleccionadas explícitamente.
- Exportación histórica separada: identidad mínima, categorías autorizadas, retiro, cuenta vinculada y reasignación sin heredar evidencia. Unidades/fechas/archivo/página/fila se conservan; no alimenta gráficos actuales ni clínica completa.
- Montaje mínimo sobre entrega 4; RPC publicado VOLATILE heredado íntegro; OCR y CSP conservados; ausencia de agenda/equipo/comunicaciones/cartera futuras.

## Pruebas propias ejecutadas

1. Focal independiente inicial: **53 aprobadas, cero fallos, cero omitidas, doce archivos**, incluyendo persistencia/roles/exportación, utilidades, ficha, documentos, permisos, montaje y regresión PostgREST heredada. `planv-release5-independent-nutrition-20261014.json`.
2. Rereview inicial de marca: **cinco aprobadas**, fichero `planv-release5-brand-independent-20261014.json`.
3. Rereview final de marca y lifecycle: **once aprobadas, cero fallos, cero omitidas, dos archivos**. `planv-release5-export-independent-final-20261014.json`; cinco de marca y seis de cierre/cambio de paciente, pedido exitoso, fallo conservando pedido, bloqueo de navegación y doble clic.

Estos resultados no se suman ni se atribuyen a la suite completa. `git diff --check` aprobó. Fuente JSON de Nutrigo, registro del otro hilo, package/lock, worker y CSP/rutas web sin diferencias propias en esta cabeza. La suite completa posterior a los fixes y los gates corresponden al autor/coordinador; no se repitieron aquí.

## Límites y veredicto

Kerr automático continúa pendiente de referencia clínicamente utilizable y aprobación profesional; esta etapa conserva sólo resultados declarados. La recepción real y sus tablas se incorporan en entrega 6: aquí se prueba una identidad sin rol clínico y el rechazo en rutas, sin afirmar membresía operativa implementada. Tampoco se verificaron proveedores, captura física, fidelidad visual, cobertura porcentual ni bloqueos entre procesos de producción.

**Revisión de código: apta, sin P1/P2 abiertos después de los fixes.** El PR depende del gate completo posterior del autor y la comprobación correspondiente en CI. Nada aplicado en producción.
