# Corte 30 — paquete de aprobación 016 y staging RLS

Estado: **completado** (2026-09-08). Corte exclusivamente documental-operativo;
no se aplicó SQL, no se conectó Supabase, no se añadieron credenciales y no se
inició email, Storage ni Mercado Pago.

## Entregado

`docs/016-approval-and-staging-checklist.md`:

- siete puertas de aprobación con evidencia, responsable a asignar y estado;
- decisiones pendientes de privacidad/retención, invitaciones, Storage, pagos,
  IA y secretos;
- entorno staging descartable y fixture sintético obligatorio;
- matriz RLS `RLS-01` a `RLS-23`, contra objetos reales del 016 v2;
- procedimiento para que un DBA convierta, tras go/no-go, el borrador en una
  migración nueva e inmutable sin ejecutar el draft;
- evidencia mínima que permite decidir no aprobar / aprobar staging / aprobar
  producción.

El checklist se enlazó desde `README.md`, `docs/supabase-setup.md` y
`docs/contract-016-review.md`.

## Garantías y límites

- El encabezado `DRAFT v2 — REVIEW ONLY — DO NOT APPLY / NO CORRER` permanece
  intacto en el contrato.
- El documento afirma explícitamente que no autoriza ejecutar SQL, conectar
  Supabase, cargar datos reales ni configurar secretos/integraciones.
- No asigna responsables ni plazos legales: se dejan para el titular,
  privacidad/legal, DBA, seguridad y operación correspondientes.

## Verificación

- Validación estática: guard DRAFT, 23 casos de matriz, enlaces a revisión/setup
  y prohibición de activación: todo presente.
- `npm test`: 27 archivos / 161 tests ✓
- `npm run check` ✓
- `npm run build`: 112 módulos; entrada 434.27 kB / 125.10 kB gzip ✓
- `npm audit`: 0 vulnerabilidades ✓
- `npm audit signatures`: 90 ✓; attestations: 45 ✓
- `git diff --check` ✓

## Próximo paso

La próxima acción no es código: designar responsables y completar las puertas
1–6. Con ese go/no-go, un DBA puede preparar la migración staging y ejecutar la
matriz RLS con fixtures sintéticos. Hasta entonces el producto continúa en modo
demo/memoria.
