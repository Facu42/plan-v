# Planes parte 3e: opciones reales del pedido y bolsa mensual

26/10/2026. Rama `work/planes-parte-3e-armar-ia`, desde main `876aa4e` (post #187). No incorpora parte 3d/#188. Autorización: brief de Facundo `/workspace/brief-planes-parte-3e-codex.md`. Sin merge, producción ni llamadas a proveedores reales.

## Resultado y contratos

- Formato, Medidas y los cinco controles de Incluir llegan a `dietary_preferences` de `POST /api/ai/jobs` (`menu_draft`), al contexto privado y al prompt del proveedor. Se mantiene el esquema existente: hasta diez preferencias de ochenta caracteres. Se agrupan extras completos; si las opciones exceden diez líneas, se frena con aviso antes de pedir la propuesta, evitando descartar cuidados o contexto silenciosamente. El texto libre y las líneas de ficha conservan el recorte existente de ochenta caracteres.
- Son preferencias para orientar la generación, no un cambio de diseño del editor/PDF. El prompt pide medidas con referencias, recetas y equivalencias del catálogo disponible y no inventar precios. No se promete que el modelo cumpla cada preferencia ni que cree anexos que el contrato de salida no contempla. Lista de compras sigue derivándose del plan; costo sin precios queda sin estimar.
- Se amplía **la lectura existente** `GET /api/patients/:id/ai/jobs`: agrega `usage` nullable, sin cambiar `jobs` ni `source`. No hay endpoint nuevo. `usage` contiene `month`, `used_micros`, `limit_micros`, `scope: global`, `source: memory|supabase`. Respuesta `Cache-Control: no-store`; autorización profesional y pertenencia de paciente antes de leer.
- En persistencia se consulta exclusivamente `clinical_ai_budget_months`, columnas `used_micros,limit_micros`, por mes argentino. Se muestra consumo más reservas pendientes y el límite guardado. Es la **bolsa compartida de Plan V**, no un saldo por profesional ni factura del proveedor. No se leen operaciones, pacientes ni cachés clínicos para este agregado.
- Sin fila, tabla disponible, conexión o cifras válidas se devuelve `usage: null`: pantalla «Sin dato» con explicación, sin cero ni tope inventados. Los modelos gratuitos omiten `reserveSpend` cuando el costo es cero; pueden no crear fila mensual. No se infiere de eso el gasto del proveedor ni cantidad de generaciones. En demo se lee la bolsa del proceso y se identifica como demo local.
- La lectura se renueva al entrar, cambiar paciente o comenzar/terminar un pedido, y se cancela al desmontar. No es un monitor en tiempo real.
- Dictar y Adjuntar siguen con «Próximamente». Publicar y Aplicar mantienen sus APIs y permisos; generar no aplica ni publica.
- No hay migraciones, nuevas dependencias, variables ni configuración de producción. Inter y el CSS del boceto se conservan.

## Evidencia

- Pruebas primero: unit roja por ausencia de Formato; uso sin módulo antes de implementarlo; e2e rojo al encontrar el gasto fijo; prueba roja de exceso de opciones y de no inventar costos antes de sus cambios.
- `npm test`: **3.369 aprobadas, dos omitidas preexistentes, 535 archivos**, 115,23 s. Incluye permisos, aislamiento, aplicación/publicación, gasto y contratos existentes.
- `npm run check`: aprobado (frente, servidor y e2e).
- `npm run build`: aprobado, 20,53 s; advertencia existente de paquetes grandes.
- `npm audit --audit-level=moderate`: cero vulnerabilidades.
- Migraciones, manifiesto de despliegue, vistas públicas, secretos y `panel:v29:check`: aprobados. No se aplicó SQL. No hay script de lint; se ejecutó `git diff --check` y tipos, sin afirmar un lint inexistente.
- E2E propios: dos aprobados, incluida creación **202** con permiso y alergias declaradas, llegada de las cinco opciones, panel Chat y ausencia de publicación. El importe US$ 1,20 / US$ 3,00 del navegador es una respuesta controlada; la lectura del registro se prueba en el módulo (frontera Supabase simulada) y la integración real en memoria. No se probó contra Supabase hospedado.
- E2E anteriores de parte 3: dos aprobados (PDF/descarga/impresión, vista de paciente y conflicto al publicar). Un primer intento del e2e nuevo recibió 403 porque otra prueba dejó seleccionada a Marina: se corrigió la preparación para elegir explícitamente a Sofía; no se debilitó el permiso.
- Regresión adicional de listado/editor/enlaces y plantillas/copia: siete de ocho aprobados en la ejecución conjunta; uno agotó el tiempo en `page.goto` al esperar carga de la página. Ese mismo caso pasó aislado después (5,8 s), sin modificar código ni expectativas. En total se observaron aprobados los doce recorridos de Planes entre las ejecuciones; no se presenta la tanda con timeout como verde.
- Capturas inspeccionadas con datos inventados: [registro ausente a 1440](../screenshots/planes-p3e/uso-sin-registro-1440.png) y [armado a 390](../screenshots/planes-p3e/armar-390.png). Inter comprobada en navegador. El panel conserva desplazamientos internos; no se afirma paridad visual general aprobada.
- Revisiones `code-reviewer` y `reality-checker`, con modelo heredado sin cambio: sin bloqueos nuevos; señalan expresamente el límite del registro gratuito y la diferencia entre fixture de navegador y lectura del servidor.
- Contrato visual general: **HOLD, dos diferencias** en «Acción de la fila» del listado de Planes, alto 27 px en boceto / 26 px en app, tema claro y oscuro. La ejecución completa usó API propia aislada en 3127 y web 5277. `PanelPlanes.tsx` y el CSS no tienen cambios frente a `876aa4e`: diferencia heredada fuera del slice. El primer intento se había detenido en `#sxchat .sxfrom`, con el puerto de API ocupado; no se usa ese intento como evidencia final.

## Regression Guard — paso 10

- **Flujos críticos verificados:** ✅ pedido con opciones y cinco extras (unit/e2e/contexto/proveedor); ✅ consumo real, reservas, cambio de mes argentino, límite guardado y vacío ante error (módulo/integración); ✅ permiso de IA y alergias (suite y creación e2e); ✅ propuesta privada, publicar solo tras revisión y conflicto de versión (suite y e2e de parte 3). Login demo y navegación a Planes recorridos. Sesiones firmadas en infraestructura real quedan al CI; no se afirman probadas localmente.
- **Regresiones cubiertas:** opciones cosméticas que no viajaban; lectura fija sin fuente; consumo real sustituido por cero; exceso de opciones que descartaría contexto; propuesta que no publica sola, consentimiento retirado y contexto vencido conservados por pruebas existentes.
- **Contratos revisados:** UI → preferencias → validación compartida → contexto → prompt; formato/medidas/extras dentro de 10×80. Respuesta de listado ampliada de forma aditiva con `usage` nullable. Servidor → tabla mensual, exclusivamente agregado global después de autorización. Esquema de salida y APIs de aplicar/publicar intactos.
- **Áreas frágiles:** permisos/asignación y cambios de contexto en trabajos de IA; publicación revisada; mes argentino y diferencia entre reserva y cargo. Se conservaron las guardas y se verificaron en suite; no se accede a filas clínicas ajenas. No se inventa un gasto cuando la tabla no permite verificarlo.
- **Migraciones:** N/A. Reversión mediante revert del commit, sin cambios de datos.
- **Fire test:** ✅ se cambió temporalmente `used_micros: used` por `used_micros: 0`; la prueba falló esperando 1.200.000 y recibiendo cero. Restaurado; 17 pruebas focales aprobadas después.
- **Automatizaciones nuevas:** pruebas unit/integración y e2e descubiertas automáticamente por los comandos existentes del CI. No hay paso manual nuevo de despliegue, migración, clave o servicio.
- **Veredicto:** HOLD para integración por las dos diferencias heredadas de alto en filas del listado; PR en borrador. Slice funcional comprobado localmente; sin producción ni merge.


## Rebase de #189 sobre main post-#188 — 26/10

Base actual: `ae04a35`. Único conflicto manual en `docs/coordinacion-agentes.md`, conservando ambas filas. Git combinó automáticamente `server/ai-jobs/flow.integration.test.ts`, `server/ai/menu-draft.ts`, `src/components/nutrigo/planes-asistente.ts` y `src/types/ai-jobs.ts`. Revisión code-reviewer sin problemas concretos; alcance día/comida/todo, Deshacer e historial de 3d conservados junto con 3e.

### Regression Guard — paso 10 del rebase

- Flujos críticos verificados: ✅ 52 pruebas aprobadas en siete archivos: alcance, Deshacer con revisión/409, preferencias y límites, prompt, bolsa mensual real/vacía y flujo de trabajos con permisos/contexto. Historial conservado por comparación del código; no se repitió navegador.
- Regresiones cubiertas: no pisar ediciones posteriores al deshacer; no perder preferencias ni inventar consumo; no aplicar/publicar al generar.
- Contratos revisados: preferencias → contexto → prompt; respuesta aditiva `usage`; alcance y revisión de aplicación/restauración.
- Áreas frágiles: combinación de opciones con alcance, permisos y revisión del borrador. Diff comparado con main y revisión independiente de código sin hallazgos.
- Migraciones: N/A; sin cambios de base ni producción.
- Fire test: ✅ consumo persistente forzado temporalmente a cero detectado por `usage.test.ts` (esperaba 1.200.000). Restaurado; tres pruebas del módulo nuevamente aprobadas.
- Automatizaciones nuevas: ninguna; se mantienen las pruebas existentes del CI.
- Tipos y formato: `npm run check` aprobado (frente, servidor y e2e); `git diff --check` aprobado. No hay script de lint.
- Veredicto: rebase funcional verificado con pruebas focales. No se ejecutó suite completa ni build en esta tarea por alcance solicitado. La decisión de merge y los controles remotos quedan al orquestador; se conserva la advertencia visual histórica documentada arriba.
