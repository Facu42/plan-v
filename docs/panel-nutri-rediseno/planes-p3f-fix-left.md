# Planes 3f: diálogo alineado con v29

26/10/2026. Misma rama y [PR #190](https://github.com/Facu42/plan-v/pull/190), desde 4216397. Sin merge ni producción.

El límite de ancho nativo de dialog dejaba espacio libre a la derecha en mobile. Se elimina ese límite, se usa border-box y ancho automático entre ambos bordes. Desktop conserva 440 px y márgenes superior/derecho/inferior de 10 px. Mobile conserva máximo de 86dvh y radios superiores de 22 px. El footer usa flex, separación de 8 px y acciones al final. No se modifica markup, copy, mail, programación ni impresión.

Capturas nuevas, con datos ficticios: [390 claro](../screenshots/planes-p3f/programar-390-claro.png), [390 oscuro](../screenshots/planes-p3f/programar-390-oscuro.png), [1440 claro](../screenshots/planes-p3f/programar-1440-claro.png), [1440 oscuro](../screenshots/planes-p3f/programar-1440-oscuro.png). Las cuatro fueron inspeccionadas.

## Informe del paso 10 — Regression Guard

- **Flujos críticos verificados:** ✅ Impreso, mail demo sin alterar publicación, programación con revisión/errores/persistencia, pestañas e Inter: tres e2e 3f aprobados. Prueba geométrica nueva en 390/1440 y ambos temas.
- **Regresiones cubiertas:** el e2e ahora exige ancho completo y borde inferior mobile, 440 px a la derecha desktop y CTA al final. Antes solo comprobaba que entrara en pantalla; el test nuevo falló antes del arreglo por CTA desplazado 319 px.
- **Contratos revisados:** solo CSS compartido por Programar/plantillas/copiar; ninguna frontera de API, tipos o validación cambia. Sin acoplamientos nuevos.
- **Áreas frágiles:** ancho máximo nativo de dialog y footer compartido; comprobados mediante geometría real de Chromium, temas y capturas. Code-reviewer y reality-checker aprobaron sin bloqueantes.
- **Migraciones:** N/A. Sin acceso a base de producción ni proveedores.
- **Fire test:** ✅ se reintrodujo temporalmente un máximo de ancho de viewport menos 32 px; el e2e falló con 358 px frente a 390 esperados. CSS restaurado.
- **Automatizaciones nuevas:** las comprobaciones geométricas quedan en el spec existente de 3f. El spec basura solicitado no existía, ni tracked ni untracked.
- **Verificación:** tipos, build, secretos, panel:v29:check y diff whitespace aprobados. No hay script de lint en este repo. Build conserva aviso de tamaño de bundles y e2e aviso de Node 20.
- **Suite completa y repetición final:** Node 22, 539 archivos aprobados; 3.396 pruebas aprobadas y dos omitidas existentes. Tanda final parte 3 + 3f: cinco e2e aprobados, incluida geometría tras restaurar el CSS.
- **Veredicto:** SHIP para actualizar el PR draft #190. Sin merge ni despliegue.
