# Documentos de producto de Plan V

Armados por Facundo el 14/10/2026 para ordenar el proyecto; corregidos el mismo día contra el estado
real (código en `main`, PR abiertos, ramas de Codex y base de producción). Antes de empezar una tarea,
leé también [`../coordinacion-agentes.md`](../coordinacion-agentes.md): dice qué tiene cada agente.

| Documento | Para qué sirve |
|---|---|
| [01-PRD.md](01-PRD.md) | Qué es Plan V, para quién y qué funciones tiene (con su estado) |
| [02-TRD.md](02-TRD.md) | Cómo está hecho: arquitectura, tecnologías, IA, seguridad |
| [03-flujo-app.md](03-flujo-app.md) | Recorridos de la nutri y de la paciente, pantalla por pantalla |
| [04-brief-diseno.md](04-brief-diseno.md) | Reglas de diseño (Nutrigo) |
| [05-esquema-backend.md](05-esquema-backend.md) | Tablas, permisos y funciones de la base |
| [06-plan-implementacion.md](06-plan-implementacion.md) | Etapas de trabajo |
| [07-decisiones-recomendadas.md](07-decisiones-recomendadas.md) | Decisiones abiertas con una recomendación cada una |
| [competencia-funciones.md](competencia-funciones.md) | Funciones y precios de Nutriboost y NutriDesk frente a Plan V |

Leyenda en todos: ✅ en producción · 🟡 parcial · 🔜 en código o PR · 🔶 hecho por Codex, sin juntar · ❌ planeado.

Notas:
- Algunas fuentes citadas (`/workspace/...`) eran archivos de trabajo locales del autor y no están en
  el repo. Las de este repo (`docs/`, `design/`) sí.
- Los documentos viejos de `docs/` (planes de septiembre, `pending-work.md`) quedan como historia.
  Si contradicen a estos, mandan estos y `coordinacion-agentes.md`.
- Cada tabla de estado vale a la fecha de su última corrección. Antes de afirmar que algo falta,
  buscalo en `main`, en los PR y en las ramas de Codex.
