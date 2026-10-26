# Planes parte 3b: PDF real

26/10/2026 · Codex · Rama `work/planes-parte-3b-pdf-real`, sobre #185, que sigue abierto. PR dirigido a `work/planes-parte-3-ia-publicar`. Sin merge ni cambios en producción.

Los cinco controles del boceto v29 pasan a la copia elegida. Descargar genera un archivo PDF local mediante Blob; Imprimir abre el diálogo del navegador. Ambas acciones conservan la revisión y selección de copia guardada o publicada. No publican, no notifican y no guardan preferencias clínicas.

- Marca apagada: sin logo ni identidad del consultorio, documento monocromático.
- Medidas apagadas: cantidades en gramos cuando existe equivalencia; sin equivalencia se informa cantidad sin confirmar. El análisis nutricional conserva los datos originales.
- Compras: agrega o retira la lista de la copia, usando la misma lista que el editor.
- Recetas: muestra u oculta ingredientes y pasos; conserva títulos y porciones.
- Semana por hoja: cada bloque de siete días desde el inicio del plan empieza en página nueva. Una semana extensa puede continuar en más hojas; no se comprime texto clínico para forzar una sola página.

Inter se incorpora desde la dependencia local existente, con su licencia. No se agregan servicios externos ni dependencias. Los documentos siguen escapando textos; la marca sigue validándose y las cantidades impresas no modifican el plan.

## Paso 10 — Regression Guard

- Flujos críticos verificados: ✅ documento y opciones; ✅ PDF real; ✅ descarga e impresión en navegador; ✅ revisión y conflicto al publicar. Los recorridos globales de acceso, pagos e importación no se modifican y no se consideran probados por el smoke de Planes.
- Regresiones cubiertas: interruptores desconectados, botones con el mismo destino, cantidades falsas al ocultar medidas sin equivalencia, pérdida de porciones al ocultar recetas. Pruebas de copia publicada, escape de textos y borrador conservadas.
- Contratos revisados: opciones del panel → diálogo → HTML/PDF; selección de versión y revisión actual contra API profesional sin alterar endpoints ni permisos.
- Áreas frágiles: equivalencias sin snapshot (no se inventan gramos); copia desactualizada (se mantiene bloqueo); documento largo (salto semanal con continuación); fuentes locales preparadas en build.
- Migraciones: no corresponden.
- Automatizaciones nuevas: preparación de Inter en el build existente; smoke comprueba descarga y llamada de impresión; prueba lee la segunda página del PDF con pdfjs.
- Fire test: ✅ copia aislada en /tmp/plan-v-pdf-fire. Se anuló deliberadamente la inclusión de compras: falló exactamente la prueba que exige esa sección (1 fallida, 5 aprobadas). El worktree no se mutó para esta prueba.
- Verificación: `NODE_OPTIONS=--experimental-websocket npm test -- --maxWorkers=2`: **3.357 aprobadas, dos omitidas, 532 archivos**. Node 20 requiere esa opción para los clientes de Supabase; sin ella había cinco fallos de WebSocket ajenos al PDF. Se actualizó la prueba que exigía el aviso anterior por la comprobación de su ausencia. No se retiraron ni omitieron pruebas.
- `npm run check`: aprobado. `npm run build`: aprobado (avisos existentes de tamaño y comentarios de dependencias). `npm run check:secrets`: aprobado. No existe script de lint; `git diff --check` aprobado.
- `CHROMIUM_PATH=/usr/bin/google-chrome npm run test:e2e -- e2e/planes-parte-3.spec.ts`: **2 aprobadas**, en memoria y sin Supabase. Descarga .pdf, opciones en vista, llamada de impresión y conflicto al publicar. El diálogo nativo se sustituye en la prueba por una marca observable; se comprueba su invocación, no una impresora física.
- Pruebas específicas de documento, marca, PDF y ficha: **20 aprobadas** en cinco archivos. pdfjs lee la segunda página y confirma la fecha de la segunda semana.
- Revisión code-reviewer / reality-checker: tres observaciones corregidas (equivalencias, porciones y mensaje de receta oculta); revisión final sin bloqueos.
- Veredicto: **SHIP para revisión del PR**, sin autorización de merge. Límite de paginado declarado arriba.
