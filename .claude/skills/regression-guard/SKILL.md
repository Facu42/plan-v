---
name: "regression-guard"
description: "Safeguard critical software flows against regressions when an AI agent changes code: a 10-step checklist workflow that maps critical user flows, verifies test coverage, reviews type/validation/API contracts, flags fragile areas, validates DB migrations, runs pre-deploy checks, and automates anything that depends on human memory. Use whenever an agent is about to modify, refactor, or deploy app code (RutiChat wacrm v2, Plan V CRM, or any of Facu's apps)."
metadata: { "includeInPrompt": true }
---

# Regression Guard

## Purpose
Prevent "changed one line, broke five things" syndrome. Before an AI agent ships a code change, it runs this 10-step workflow against the change to prove the critical flows still work. It applies to any app the agent is programming; adapt the critical-flows list to the project at hand.

## Workflow

### Step 1 — Map the critical flows
List the user flows that must never break (e.g. Registro, Login, Carrito, Pago, or the app's equivalents: for the Plan V CRM, login, lead creation, pipeline stage moves, CSV import; for RutiChat, login, WhatsApp conversation view, contact management, message send). Write the list down explicitly. For each flow, note whether automated test coverage exists. If a critical flow has no tests, flag it as a gap and do not proceed silently — report it.

### Step 2 — Add regression tests for past bugs
Search git history / issue tracker / memory for bugs that were fixed in this codebase. For each fixed bug that could recur, verify a regression test exists that would fail if the bug were reintroduced. If the bug is fixable without a test, the work is not done: add the test first.

### Step 3 — Review contracts between layers
Check the boundaries: Frontend ↔ Backend ↔ APIs. Verify types, request/response validations, and data contracts are consistent on both sides of every boundary the change touches. A change in a field name, enum, or payload shape on one side must be mirrored on the other, with validation errors handled (not silently ignored).

### Step 4 — Detect hidden coupling
Scan the files the change touches for: duplicated logic (same rule implemented twice), hidden dependencies (shared mutable state, implicit ordering), and overly coupled components (a small change forcing edits in many places). If the change amplifies coupling, propose decoupling before shipping.

### Step 5 — Validate database migrations
If the change includes schema changes: verify there is a migration path (v1 → v2) that is safe, non-destructive (no data loss on columns being altered/dropped), and has a rollback strategy. Never run destructive migrations without a tested rollback.

### Step 6 — Run the pre-deploy gate
Before any deploy or merge, run the full verification suite in order and confirm all pass:
1. Linting
2. Unit/integration tests
3. Build (no build errors)
4. Type checking
Report failures explicitly — a deploy with a red check is a blocker, not a suggestion.

### Step 7 — Identify fragile areas
Name the parts of the project that break most easily (commonly: Pagos, API clients, auth, imports). For each, write one sentence: what could break it, and what would the symptom be? If the current change touches a fragile area, apply extra scrutiny (Steps 2, 3, 6) at double depth.

### Step 8 — The fire test
Make one small, intentional, controlled change in a sandbox/test environment that should be caught — e.g. alter a threshold in a discount or validation function so a known test fails. Confirm the test suite actually catches it (test goes red, then revert). This proves the safety net is real, not decorative. If nothing catches it, the net has a hole: fix the test before shipping.

### Step 9 — Automate what depends on human memory
List every step of the change's deploy process that currently relies on someone remembering to do it (run migrations before deploy, clear cache, set an env var, notify a service). Automate each one or convert it into a mandatory checklist entry in the deploy pipeline. If a step only exists in someone's head, it will be forgotten — eliminate it.

### Step 10 — Sign-off report
Produce a short report with this structure:
- Flujos críticos verificados: list, each with test status (✅ covered / ⚠️ gap)
- Regresiones cubiertas: which past bugs now have tests
- Contratos revisados: which boundaries were checked
- Áreas frágiles: what was identified, what was done about it
- Migraciones: safe / rollback plan, or N/A
- Fire test: result (caught ✅ / hole found and fixed)
- Automatizaciones nuevas: what no longer depends on memory
- Veredicto: SHIP / HOLD with reason

## Output Contract
- The sign-off report above is the deliverable; it must be produced for every non-trivial change.
- Report blockers honestly: a HOLD verdict with the reason is a success, not a failure.
- Never claim a flow is covered without evidence (a passing test you actually ran, not "probably fine").

## Operating Rules
1. App boundaries are hard constraints. Facu's production Supabase project is untouchable: no tables, migrations, or seeds against production. All verification runs on local/test environments or a fully local simulation.
2. Critical-flow gaps (Step 1) and red pre-deploy checks (Step 6) are blockers — surface them to the user, do not silently ship.
3. Adapt Step 1's flow list to the app being worked on; never assume flows from another project.
4. The fire test (Step 8) runs only in test/sandbox environments — never mutate production data to prove a point.
5. Prefer small, verifiable steps over broad claims. Evidence (test output, build logs) beats narrative.
6. If the skill's workflow conflicts with the user's explicit instruction, the user's instruction wins for that task.
