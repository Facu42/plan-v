# Biblioteca v29: verificación del 25/10/2026

Rama: `codex/biblioteca-v29`, desde `193d4ed` (Alimentos #181). Implementación `9331911`, [PR #182](https://github.com/Facu42/plan-v/pull/182). Autorizada por Facundo: «APROBADO PARA IMPLEMENTAR YA. No pidas diseño ni esperes otra confirmación».

`/crm/biblioteca?biblioteca=recursos` usa las tarjetas y la columna «Quién lo abrió» de `sxBiblioteca`, en `design/panel-nutri/v29/panel-trabajo.html`. Conserva el catálogo real, borradores, nuevas versiones, publicación, despublicación, asignaciones y lectura. «Ver contenido» abre esas funciones en el panel lateral del boceto. «Ver recetas» conserva el catálogo de recetas existente.

«Avisar por la app» permite elegir entre las pacientes asignadas y les manda un mensaje mediante el chat existente. Si falla una destinataria, conserva su identificador para reintentar y no vuelve a enviar a quienes ya recibieron el mensaje. Las tarjetas reconocen asignaciones tanto por slug como por UUID.

La API de creación admite texto por secciones. Adjuntar video o PDF queda indicado como «Próximamente» dentro del editor. No se simulan archivos ni formatos que el servidor no guarda. Con más de cuatro recursos, las filas conservan una altura legible y se desplazan dentro de la columna.

## Revisión de continuación del 25/10

Se volvió a contrastar la entrega con `sxBiblioteca` y `onLib`, sin cambiar el diseño aprobado. El enlace anterior `/crm/recetas?paciente=...` perdía la selección de Recetas al convertirse en Biblioteca. Ahora conserva el catálogo y la paciente, también después de recargar; la navegación interna a Recetas elige esa sección explícitamente. Biblioteca sin parámetros muestra su título correcto.

El [control firmado anterior](https://github.com/Facu42/plan-v/actions/runs/40242195904) aprobó sus 30 pruebas de permisos y aislamiento, pero el navegador falló después al buscar «Nueva receta» en ese enlace. Además, el mismo recorrido conservaba selectores de asignación de la pantalla anterior: ahora elige una tarjeta publicada y asigna desde el panel lateral v29, manteniendo la comprobación posterior desde la API de la paciente.

La prueba unitaria nueva y el recorrido del enlace anterior fallaron antes de la corrección y pasaron después. Las 12 pruebas de rutas y del modelo de Biblioteca están aprobadas. La suite final aprobó **3.300 pruebas, con cuatro omitidas, en 523 archivos** (323,09 segundos). Los diez e2e completos pasaron en 1,2 minutos; tipos, compilación y contrato visual v29 también pasaron sobre la corrección. Una pasada e2e anterior recibió 429 al compartir la misma IP demo: el último recorrido ahora respeta un `Retry-After` válido de hasta 60 segundos y reintenta una sola vez, conservando la exigencia de respuesta 200. No se desactivaron los límites del servidor.

Se revisó el título y el apilado con `/browse` a 1440 y 390, con datos ficticios. Las nuevas capturas y los logs de esta revisión quedan en `.npm-cache/verification/`; las ocho capturas enlazadas abajo corresponden a la entrega inicial. `code-reviewer` y `reality-checker`, ambos con `gpt-6.1-sol`, revisaron esta continuación sin hallar bloqueos de código.

**Paso 10 actualizado:** ✅ flujos críticos locales (3.300 pruebas y diez e2e); ✅ regresión del enlace anterior y recarga; contratos de asignación y lectura existentes conservados; área frágil: canonización de enlaces y selectores del navegador; migraciones: no corresponden; fire test: prueba de alias y e2e rojos antes del arreglo, verdes después; automatización: regresión incorporada a los comandos de CI existentes. Sin cambios de producción.

**Estado de la continuación:** apta para revisión por el mismo PR; nueva comprobación firmada pendiente de subir la corrección. Docker está instalado en esta PC, pero su servicio no está iniciado: no se ejecutó aquí la pila descartable con sesiones firmadas. El resultado remoto previo no certifica el script corregido. Hasta completar el control remoto, **HOLD para merge**.

## Comprobaciones de la entrega inicial

| Comprobación | Resultado |
|---|---|
| `npm test -- --maxWorkers=2 --reporter=dot` | 3.299 aprobadas, 4 omitidas; 523 archivos aprobados |
| `npm run check` | Tipos del frente, servidor y e2e aprobados |
| `npm run build` | Aprobado; código de salida 0. Advertencias de tamaño de paquetes y anotación de Zod |
| `CHROMIUM_PATH=... npx playwright test` | 9 recorridos aprobados: 3 nuevos y 6 existentes |
| `CHROMIUM_PATH=... node scripts/panel-v29-contrato.mjs --write` | Aprobado; siete piezas de Biblioteca iguales en ambos temas, además de las pantallas anteriores |
| `node scripts/check-secrets.mjs` | Aprobado |
| `git diff --check` | Aprobado |

No hay comando de lint en este proyecto: se ejecutaron tipos y revisión del diff. El contrato vigente es el de v29; el contrato anterior apunta a otro boceto y no representa esta fase.

En esta PC se usó Chrome instalado mediante `CHROMIUM_PATH`; Playwright mantiene su navegador habitual cuando esa variable no está definida. La primera suite mostró dos falsos fallos por CRLF de Windows: se normalizó el texto al verificar archivos generados y se hizo compatible la expresión regular de la prueba móvil. Una ejecución con mucha concurrencia cerró procesos inesperadamente; la ejecución completa con dos procesos terminó en verde. Los logs locales están en `.npm-cache/verification/`.

## Informe del paso 10 de regression-guard

- **Flujos críticos verificados:** ✅ acceso demo, alta e ingreso de paciente, publicación del plan, diario y revisión de comida, aviso de recurso hasta su lectura (seis e2e existentes); ✅ crear/publicar/asignar y leer el recurso desde la paciente, reintentar avisos fallidos sin duplicar, recuperar error del catálogo y apilar a 390 (tres e2e nuevos). Los permisos y el aislamiento usan los contratos existentes, cubiertos por la suite del servidor. No hubo prueba nueva contra cuentas reales.
- **Regresiones cubiertas:** slug y UUID identifican el mismo recurso; borradores no asignables; lecturas de otro recurso no se mezclan. El recorrido prueba que «Lo abrió» aparece después de abrir el material en la app de la paciente. Se conservan las pruebas de asignaciones repetidas, rechazo de escritura parcial y vistas seguras del servidor. La prueba móvil detecta la falta de apilado; las pruebas de archivos aceptan CRLF sin ignorar diferencias de contenido.
- **Contratos revisados:** catálogo y guardar/publicar/despublicar de `resourcesApi`; `api.assignResource` usa el slug y devuelve pacientes actualizadas; `read_at` sigue siendo la única señal de apertura; `api.sendMessage` conserva `client_id` en los reintentos. React muestra los textos como texto, sin HTML externo.
- **Áreas frágiles:** recursos publicados y asignaciones (borradores bloqueados; asignaciones existentes conservadas); mensajes en lote (bloqueo de doble clic, destinatarias fallidas separadas, identificador estable); navegación con cambios pendientes (protección del editor y del selector); estilos heredados (colores de v29 y apilado comprobados). Los avisos push siguen usando el texto genérico del servidor existente.
- **Migraciones:** no hay cambios de base, configuración de producción ni servicios externos. Todas las pruebas usaron memoria o simulaciones locales.
- **Fire test:** ✅ se cambió temporalmente la detección de asignaciones para devolver ninguna. Fallaron dos pruebas; el archivo se restauró automáticamente y las tres pruebas del modelo volvieron a pasar. La suite final se corrió con el archivo restaurado.
- **Automatizaciones nuevas:** e2e de creación, publicación, asignación, lectura, reintento parcial, errores y celular; siete piezas añadidas al contrato v29. Entran en los comandos y CI existentes. No hace falta recordar migraciones, variables ni activaciones para publicar este cambio.
- **Revisión:** `code-reviewer` detectó el apilado y un acento mal escrito; ambos corregidos. Segunda revisión sin bloqueos. `reality-checker` verificó pruebas y capturas; alcance local, sin afirmar igualdad de pantalla completa píxel a píxel.
- **Veredicto:** **SHIP para revisión por PR.** Sin merge a main ni publicación de producción desde esta entrega. Adjuntos de video/PDF siguen pendientes y se informan en pantalla.

## Comparación visual

Capturas con datos ficticios mediante `/browse` de gstack. La referencia móvil incluye los controles de presentación del archivo del boceto; permite comparar las piezas y el apilado. El contrato compara medidas, tipografía y colores resueltos; no demuestra igualdad de pantalla completa con cantidades distintas de recursos.

| Tamaño y tema | Boceto | App |
|---|---|---|
| 1440×900 oscuro | [Ver](biblioteca-v29-evidencia/boceto-dark-1440.png) | [Ver](biblioteca-v29-evidencia/app-dark-1440.png) |
| 1440×900 claro | [Ver](biblioteca-v29-evidencia/boceto-light-1440.png) | [Ver](biblioteca-v29-evidencia/app-light-1440.png) |
| 390×844 oscuro | [Ver](biblioteca-v29-evidencia/boceto-dark-390.png) | [Ver](biblioteca-v29-evidencia/app-dark-390.png) |
| 390×844 claro | [Ver](biblioteca-v29-evidencia/boceto-light-390.png) | [Ver](biblioteca-v29-evidencia/app-light-390.png) |
