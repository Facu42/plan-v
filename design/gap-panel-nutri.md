# Gap: panel nutricionista vs referencia CRM

Fuente: `design/referencia-panel-nutri.png` (ley visual estricta).
CSS actual leído: `src/plan-v.css` (`:root` L3 + bloque `.pro-*` L25–27 + bloque `.crm-*` L37–51).
`src/styles/globals.css` es shadcn default (primary `#030213`, radius `0.625rem`) — no debe pintar el panel.
`marca/brand_kit.json` está incompleto (faltan deep, lima, yellow, lilac, fonts).

Hay **dos** paneles pro en el CSS. El que tiene que vivir es el de 3 columnas (`.crm-*`). El `.pro-shell` (sidebar 238px + dashboard overview) **no** cumple la ley.

Mapeo Dynamics → Plan V (no copiar labels):
| Mock | Producto |
|---|---|
| Sales accelerator | Mi trabajo / acelerador clínico |
| Lead | Paciente |
| Opportunity Sales Process | Proceso clínico (ingreso → plan → seguimiento → alta) |
| Up next / First Customer Call | Próxima acción |
| Lead score / Grade A | Adherencia / riesgo |
| Relationship Analytics | Vínculo / red de cuidado |
| Timeline | Timeline clínico |

---

## Blockers

| # | Qué | CSS actual | Target | Dónde |
|---|---|---|---|---|
| B1 | Layout 3 col no es el shell pro | `.pro-shell` = flex sidebar 238px + `.pro-main`. Nav activo `#e5f3eb` radius 12px | Grid 177 / 284 / 1fr. Nav cápsula lima | `.pro-shell` vs `.crm-body` |
| B2 | Token lima no existe | Lima hardcodeada 5 veces: `#eaff78` `#eeff8b` `#edff79` `#ecff73` `#eaff79` | `--pv-lima: #EAFF78` + `--pv-lima-wash` | `:root` L3 |
| B3 | Chrome Dynamics (grises) | menú `#ececea`, worklist `#f3f3f1`, frame `#f7f7f5`, appbar `#eeeeeb`, stage `#696871` | Interior: surface `#F7FAF9`, nav mint-wash. **Tirar el chrome gris** (no es producto) | `.crm-menu` `.crm-worklist` `.reference-frame` `.reference-stage` |
| B4 | Nav activo no es cápsula | `.menu-group button.menu-current { border-radius: 11px; background: #eaff78 }` | `border-radius: 99px` (cápsula) + lima | L42 |
| B5 | Rail es barra continua | `.rail-progress` grid 4 col, `border-radius: 12px`, done `#2b9981`, active `linear-gradient(90deg,#52b194,#d7efb9)`, future `#deded5` | Cápsulas sueltas. Activa = `--pv-deep` sólida. Futuras = mint/grey pills (algunas con lock) | L46 |
| B6 | Gauge dotted, no segmentado | `.score-ring { border: 6px dotted #32a48b; height: 75px }` elipse achatada | Doughnut de ticks verticales teal/deep, número Fraunces 31px + grade lima | L47 |
| B7 | Header ficha sin gradiente lima | `.patient-record` sin background. h1 **DM Sans 25px** | Gradiente lima→surface. Título **Fraunces** | L45 |
| B8 | Títulos CRM en DM Sans | `.crm-menu-heading h2`, `.worklist-head h2`, `.record-name h1`, `.crm-card h3` = `'DM Sans'` | Fraunces para display / col titles / card titles de ficha. DM Sans solo UI | L42–47 |

## Medium

| # | Qué | CSS actual | Target |
|---|---|---|---|
| M1 | Cards ficha no son neu | `.crm-card { radius 19px; bg rgba(252,251,247,.68); shadow 0 7px 14px rgba(109,92,69,.045) }` | radius 20px, `--pv-shadow` dual, glass sobre surface. Sombra actual es cálida/Dynamics, no menta |
| M2 | Command bar no es píldora | radius 9px, primary `#ecff73` | pills 99px, primary lima `#EAFF78`, idle transparent |
| M3 | Work card selected | `linear-gradient(100deg,#eeff8b,#f6f7dd)` radius 14px | wash lima unificado, radius 20px |
| M4 | Scores de lista | `.score-0` negro `#171a18` ✓, `.score-1` `#d6f6a2`, `.score-2` `#f9e89f`, `.score-3` `#ffd9d4` | 1→mint `#DCEFE7`, 2→yellow `#FBEFC5`, 3→coral wash. Negro high se queda |
| M5 | Up next lima casi bien | `.next-task { background: #edff79 }` CTA `.dark-action` `#171b19` radius 9px | bg `#EAFF78`, CTA cápsula negra 99px (no 9px) |
| M6 | Tabs idle con borde | `border: 1px solid rgba(222,219,202,.7); bg rgba(252,251,246,.55)` — active negro `#202322` ✓ | idle sin borde, transparente. Active negro se queda |
| M7 | Ficha canvas | radial yellow `#f9f7ee` + blob rosa | blobs lima + lilac + coral suave sobre `#F7FAF9` |
| M8 | `brand_kit.json` | solo primary/accent/dark/light/muted | sumar deep, lima, yellow, lilac + fonts Fraunces/DM Sans |

## Polish

| # | Qué | CSS actual | Target |
|---|---|---|---|
| P1 | `--pv-shadow` existe y está bien | usado en paciente / `.pro-*` overview, **no** en `.crm-card` | unificar |
| P2 | Radii sueltos | 11 / 12 / 14 / 19 / 9 | card 20, capsule 99, control 12 |
| P3 | `.pro-nav button.current` mint recuadro | `#e5f3eb` r12 | si `.pro-shell` sobrevive como overview, el item activo igual es cápsula lima |
| P4 | globals.shadcn | `--primary: #030213`, `--radius: 0.625rem` | no aplicar al panel nutri |
| P5 | Type scale CRM en 8–10px | microcopy 8px | piso 10px en producto (accesible). El mock es denso; no copiar el 8px |

---

## Lo que ya está bien (no tocar)

- Paleta base en `:root`: green / deep / mint / surface / coral / yellow / lilac / ink — hex correctos.
- Fraunces + DM Sans importados en L1 de `plan-v.css`.
- Grid `.crm-body: 177px 284px 1fr` — columnas de la ley.
- Lima en nav current y Up next (color; falta cápsula y token).
- Tab activa negra.
- Score circular en la lista Mi trabajo.
- Neumorfismo del lado paciente (`--pv-shadow`, pulse-card r28) — el panel pro tiene que heredar esa misma mano, no la gris Dynamics.

## Qué tiene que hacer Forge

1. Subir `--pv-lima` a `:root` (archivo listo: `design/tokens-panel-nutri.css`).
2. Matar chrome gris: `.reference-stage` / appbar Dynamics no van a producto. El panel es full-bleed surface.
3. Reemplazar `.pro-shell` overview por el shell 3 col, o que “Mi trabajo” abra este shell.
4. Rail → cápsulas. Gauge → ticks SVG. Header ficha → Fraunces + gradiente lima.
5. Unificar lima hardcodeada a `var(--pv-lima)`.
6. No usar `globals.css` shadcn para este surface.

QA visual: lado a lado con `design/referencia-panel-nutri.png`. Si no se leen las 3 columnas + cápsula lima + rail + tabs píldora + Up next lima + gauge radial, no pasa.
