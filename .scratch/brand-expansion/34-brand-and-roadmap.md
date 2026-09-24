# Corte 34 — Expansión Nutrigo e identidad Plan V

Estado: roadmap renovado y tarea 1.1 completada.

## Decisiones

- Plan V buscará paridad funcional con las doce superficies de Nutrigo mediante una implementación original.
- Cada dominio conserva un circuito nutricionista → paciente → nutricionista y aislamiento multipaciente.
- Los once módulos actuales del CRM permanecen visibles.
- La expansión obliga a revisar contrato 016 y RLS antes de persistir nuevos dominios.
- No se usan imágenes ni assets de preview de Nutrigo sin licencia.

## Registrado

- `docs/pending-work.md`: backlog canónico reemplazado por pasos 1–14 y frentes P0/P2.
- `tasks/plan.md`: arquitectura, dominios, secuencia y riesgos.
- `tasks/todo.md`: tareas ejecutables; próxima tarea activa 1.2.
- `docs/design-system.md`: identidad visual v2.
- `marca/brand_kit.json`: paleta extraída del isotipo oficial.

## Implementado en 1.1

- Paleta tipada en `src/brand.ts`.
- Isotipo oficial incorporado al componente compartido `Mark`.
- Logo visible en login, CRM, paciente y estados de carga/error.
- Tokens raíz claro/oscuro migrados a bosque, verde, hoja, dorado, coral, naranja, damasco y crema.
- Derivado de 256×256 generado desde el PNG maestro para reducir el asset de build de 1.109.828 a 55.968 bytes.

## Verificado

- RED inicial: `src/brand.test.tsx` falló por ausencia de `src/brand.ts`.
- GREEN: 34 archivos y 185 pruebas aprobadas.
- TypeScript frontend/backend aprobado.
- Build aprobado: 119 módulos y logo final de 55,97 kB.
- Auditoría: 0 vulnerabilidades; firmas y attestations verificadas.
- Browser Harness: logo y tokens comprobados en login, CRM y paciente; tema oscuro persistente.
- Captura real `C:\Users\facun\AppData\Local\Temp\planv-brand-step1-dark.png` revisada sin regresiones visuales críticas.
- `git diff --check` aprobado.

## Próximo corte

Tarea 1.2: primitives compartidas para shell, navegación, tarjetas, inputs, tablas, badges, gráficos y estados antes de crear los showrooms paciente y CRM.
