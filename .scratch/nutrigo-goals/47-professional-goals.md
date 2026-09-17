# Corte 47 — Objetivos profesionales Nutrigo

## Implementado

- `ShowroomGoals` reemplaza el acceso profesional al editor anterior de Objetivos.
- Navegación directa desde el módulo Objetivos y desde «Gestionar objetivos» sin abrir `CrmDashboard`.
- Selector multipaciente, filtros por estado, resumen agregado y acceso a la ficha conservados.
- Edición de objetivo, estado, avance y nota profesional mediante la API existente.
- Historial de cambios aislado por paciente y rotulado como exclusivo para profesionales.
- Composición adaptada de Nutrigo Progress: bloque principal de seguimiento y columna de objetivo/historial; responsive 1440/800/390 y ambos temas.
- La vista Paciente de Progreso permanece separada y sin historial/notas profesionales.

## Verificado

- RED inicial: el test falló por ausencia de `ShowroomGoals`.
- Tests focalizados: 12/12.
- Browser QA aislado en API `3012`, frontend `5182` y CDP `9230`:
  - acceso permanece en Nutrigo;
  - filtros multipaciente;
  - cambio de paciente sin fuga de historial;
  - actualización con lectura posterior de API;
  - campos visibles restaurados;
  - paciente ajeno intacto;
  - vista Paciente sin controles/notas profesionales;
  - 6 capturas responsive, claro/oscuro, sin overflow ni errores JS.
- Gate global: 112/112 suites, 262/262 pruebas, 49 archivos, TypeScript frontend/servidor, build de 121 módulos, auditoría npm, firmas y `git diff --check` aprobados.

## No incluido

- Peso, IMC, medidas corporales o fotos de progreso: el modelo actual no contiene esos datos y no se inventaron.
- Comparativas clínicas, nuevas entidades o persistencia Supabase/RLS.
- Aprobación visual general de la aplicación.
