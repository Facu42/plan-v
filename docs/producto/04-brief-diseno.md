# 04 · Brief de diseño — Plan V

> Fuentes: `design/nutrigo-fidelity.md` (**ley canónica**, 22/9), `docs/design-system.md`, `design/tokens-panel-nutri.css`, `src/features/nutrigo/*`, `src/plan-v.css`, `docs/diseno-movimiento.md`, `PRODUCT.md`.

## ⚠️ Conflicto a resolver primero
Hay dos sistemas en el repo:
| | **Nutrigo (canónico según `nutrigo-fidelity.md`, `design-system.md`, `PRODUCT.md`)** | **Paleta Plan V (`design/tokens-panel-nutri.css`, variables `--pv-*` en `src/plan-v.css`)** |
|---|---|---|
| Tipografía | Poppins | Fraunces (títulos) + DM Sans (UI) |
| Activo/CTA | Verde `#C2E66E` | Lima `#EAFF78` / verde `#3BB273` |
| Fondo | Cream `#F9F4F2` | Mint/surface `#DCEFE7` / `#F7FAF9` |
| Estado | Vigente por decisión de Facu del 22/9 | Marcada como "retirada" en la ley Nutrigo, pero sigue en el código (Fraunces aparece ~33 veces en CSS) |

**DECISIÓN FACU 14/10/2026 (ajustada el mismo día):** **la app de la paciente es igual a Nutrigo, colores incluidos (lima `#C2E66E`, Poppins). Es regla fija, para siempre.** La idea de pasar a la paciente a la paleta Plan V (`#083a30`) queda descartada. Para el panel de la nutricionista sigue la ley Nutrigo de `CLAUDE.md` mientras Facundo no indique otra cosa. La marca (verde, dorado, coral del logo) se usa solo en páginas públicas y marketing.

## 1. Paleta (Nutrigo, variables del .fig → tokens `--nv-*`)
| Token | Hex | Uso |
|---|---|---|
| `--nv-bg` | `#F9F4F2` | lienzo |
| `--nv-card` | `#FFFFFF` | cards |
| `--nv-card-warm` | `#FEFCFB` | blanco cálido |
| `--nv-ink` | `#272932` | texto principal |
| `--nv-ink-soft` | `#52545B` | secundario |
| `--nv-muted` | `#8A8C90` | apagado / nav inactiva |
| `--nv-faint` | `#BEBFC2` | deshabilitado |
| `--nv-line` | `#E1E1E2` | bordes |
| `--nv-fill` / `--nv-track` | `#EEEEEF` / `#F6F6F7` | rellenos |
| `--nv-accent` | `#C2E66E` | activo, CTA primaria (texto carbón) |
| `--nv-accent-soft` | `#DFF9A2` | positivo |
| `--nv-gold` / soft | `#FFCB65` / `#FFE6B5` | carbohidratos, energía |
| `--nv-coral` / soft | `#FFA257` / `#FFE1C9` | proteínas, alertas |

Sombra: `0 4px 12px rgba(176,176,176,0.14)`.
**Marca (solo isotipo e Instagram, no pinta la interfaz)**: verde `#23955D`, dorado `#F9B343`, coral `#F87D6D`. Logo: `Logo Plan V Nutrición - Isotipo Circular.png`.
Tema oscuro: existe en `plan-v.css` (`--pv-surface #071e18`, etc.); acentos del logo sobre verdes profundos.
Estados críticos siempre con texto o ícono además del color.

## 2. Tipografía (Poppins, `@fontsource/poppins`)
H3 26/700 · H5 22/400-600 · Title 18, 16, 14, 12, 11 (400-700) · P 12/400 lh1.5, 11/400 lh1.6 · Botón 14/12 500. Piso en producto: **11 px**. Cifras con `tabular-nums`.

## 3. Componentes
- Shell: sidebar clara (solo navegación y marca) + topbar (búsqueda, notificaciones, perfil, tema) + contenido fluido.
- Botón primario: píldora `#C2E66E` con texto `#272932`; activo de menú = la misma píldora.
- Cards: borde `#E1E1E2`, radio 16–20 px, sombra del archivo.
- Íconos lineales 18–20 px (Phosphor + `src/components/shared/Icon`).
- Gráficos y anillos de macros (ámbar carbos, naranja proteínas, verde).
- Tarjeta amarilla de cuota (`fee-notice.tsx`), tarjeta de instalar app (`install-card.tsx`), campana (`patient-notices.tsx`), foto de plato (`plate-photo.tsx`), contador animado (`CountUp.tsx`).
- Movimiento breve (`home-motion.css`, `docs/diseno-movimiento.md`); respetar `prefers-reduced-motion`.

## 4. Responsive
Breakpoints de verificación: 1440, 1024, 800, 390, 320 px. Móvil: una columna, barra inferior de hasta 5 destinos. Tablet: sidebar compacta o drawer.

## 5. Cómo se ve cada pantalla
Referencia de composición: Figma `OTolnKfsxUFjaZOhhdb04i` (Nutrigo – Nutrition & Diet Dashboard). Cuota del MCP de Figma: ~20 llamadas/mes → cada nodo se lee una vez y se asienta en `design/nutrigo-fidelity.md`.
| Pantalla (Nutrigo) | Plan V | Contenido |
|---|---|---|
| Dashboard | Inicio paciente | Plan del día, meta kcal/macros, agua, próximos turnos, avisos |
| Meal Plan / Grocery List | Plan / Compras | Semana por días y comidas; lista tildable |
| Healthy Menu | Menú (recetas) | Cards de recetas con foto |
| Food Diary | Diario | Comidas registradas con estado (pendiente/confirmada/ajustada) |
| Calendar | Agenda | Consultas |
| Messages | Mensajes | Hilo con la nutri |
| Progress | Progreso | Peso, medidas, adherencia |
| Exercises | Ejercicio | Rutina asignada |
| Health Insights | Recursos | Material de la nutri |
| — | Pagos | Cuota, historial, "avisé que pagué" |
| Panel nutri | Inicio, Pacientes, Ficha, Planes, Seguimiento… | Mismas primitives; lista multipaciente siempre accesible; cada función indica quién crea/revisa/publica |

La paciente **nunca** ve notas profesionales, borradores, razonamiento interno, otros pacientes ni controles de aprobación.
Capturas de desarrollo con datos ficticios.

## 6. Decisiones abiertas para Facu
1. ~~Paleta~~ **Cerrada 14/10:** paciente = Nutrigo exacto, colores incluidos. Abierto: ¿se borra el CSS viejo (Fraunces) cuando ninguna pantalla lo use?
2. ¿El panel de la nutri usa el layout de 3 columnas (menú / Mi trabajo / ficha) de `tokens-panel-nutri.css` o el shell Nutrigo?
3. Tema oscuro: ¿se mantiene en el alcance del piloto?
