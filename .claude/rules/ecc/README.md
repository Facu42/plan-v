# Reglas y habilidades traídas de ECC

Origen: [affaan-m/ECC](https://github.com/affaan-m/ECC), commit `ef648e0`, licencia MIT
(copia en `.claude/LICENSE-ecc`). Se trajo solo lo útil para el frente de Plan V:

- Habilidades (`.claude/skills/`): `frontend-patterns`, `react-patterns`, `react-testing`,
  `react-performance`, `tdd-workflow`, `e2e-testing`, `verification-loop`, `frontend-a11y`.
- Reglas (`.claude/rules/ecc/`): `common` (sin `git-workflow`, `hooks` ni `performance`),
  `typescript` y `react` (sin `hooks`).

No se instalaron agentes (chocan con `.claude/agents/`), ni hooks, ni cambios a `settings.json`.
Si algo de ECC contradice `docs/agentes/reglas-plan-v.md`, mandan las reglas de Plan V
(por ejemplo, el diseño exacto al archivo de Nutrigo por encima de cualquier guía visual genérica).
