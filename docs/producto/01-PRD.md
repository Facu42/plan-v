# 01 · PRD — Plan V (requisitos de producto)

> Fuentes: `PRODUCT.md`, `docs/brief.md`, `docs/decisiones-producto-2026-10-10.md` (repo `Facu42/plan-v`, `main` `ae3dc30`), `/workspace/plan-v-marketing/00-producto-y-propuesta.md`, `/workspace/plan-v-estado-2026-10-10.md`, `/workspace/nutriboost/plan-desarrollo-plan-v-vs-nutriboost-v2.md`.
> Leyenda: ✅ existe hoy (en producción) · 🟡 existe parcial / con bugs · 🔜 en código o PR, sin publicar · 🔶 hecho por Codex, sin juntar · ❌ planeado.
> **Corregido el 14/10/2026 (Claude):** estados comprobados contra `main` (ae3dc30), los PR abiertos, las ramas de Codex y las migraciones aplicadas en Supabase. 🔶 = hecho por Codex en código, **sin juntar a main ni aplicar** (PR o rama indicada): no rehacer. Reparto de trabajo entre agentes: [`../coordinacion-agentes.md`](../coordinacion-agentes.md).

## 1. Idea
**"Plan V · Tu nutricionista en el bolsillo."** Un consultorio nutricional digital con dos caras:
- **Panel de la nutricionista** (web): gestiona pacientes, ficha, ingreso, planes, recetas, registros, turnos, mensajes, cobros.
- **App de la paciente** (web instalable / PWA): ve su plan, registra comidas y hábitos, habla con su nutri, hace las compras.

Posicionamiento: "No es otra app de contar calorías. Es tu nutri, y está en tu celular." Reemplaza "el PDF perdido" por plan + seguimiento entre consultas.

Principios no negociables (de `PRODUCT.md` y `docs/limites-eticos.md`):
- **La IA propone; la profesional revisa antes de publicar.** La IA nunca envía ni publica sola, nadie diagnostica.
- Calorías y macros con **fórmula fija**; la nutri confirma la meta.
- Ausencia de registro ≠ incumplimiento. Agua sin registro = desconocida; cero declarado = dato válido.
- Funciones futuras se muestran con estado explícito, sin formularios que aparenten funcionar.

## 2. Para quién
| Usuario | Descripción |
|---|---|
| Nutricionista (rol `nutri`) | Primera usuaria: **Lic. Verónica Trenti** (@planv.nutricion). Después: SaaS para consultorios (B2B2C). |
| Paciente (rol `paciente`) | Entra **solo por invitación** de su nutri (no hay registro libre de pacientes). |
| Administrador de plataforma | Facu: "Panel del servicio" (suscripciones de nutris, pagos del servicio, pruebas). |
| Organización / equipo | Tablas `organizations`, `teams`, `patient_care_links` existen; producto multi-nutricionista ❌. |

Modelo: Plan V **no mueve plata** de la paciente: la paciente le paga a la nutri y la nutri registra el cobro. La nutri le paga a Plan V una suscripción (`nutritionist_subscriptions`, `service_payments`, gestión manual).

## 3. Funcionalidades
### 3.1 App de la paciente
| Función | Estado | Nota |
|---|---|---|
| Ingreso por invitación + ficha de ingreso + consentimientos | ✅ | Google login preparado, falta prenderlo en Supabase |
| Plan/menú semanal publicado con receta por comida | ✅ | |
| Plan nuevo con aviso y vista de cambios (`meal_plan_handovers`) | ✅ | #103, vigencia por fecha (D7) |
| Lista de compras desde el plan + ítems manuales | 🟡 | agrupar por comercio / compartir WhatsApp ❌ |
| Alternativas por comida | ❌ | la landing las promete: no prometer fuerte |
| Meta diaria kcal/macros (fórmula fija, confirmada por la nutri) | ✅ | |
| Diario de comidas con foto o texto; IA opcional con permiso, queda "pendiente de revisión" | ✅ | texto sin IA: PR #101 (migración `meal_text_without_ai` aplicada, comprobado 14/10) |
| Corregir/borrar comida o medida propia no revisada (D4) | ✅ | #100 |
| Agua, sueño, pasos | 🟡 | pasos no se ven en panel |
| Peso y medidas (con permiso), fotos/estudios privados | ✅/🟡 | |
| Mensajes con adjuntos | 🟡 | sin tiempo real |
| Turnos: confirmar o pedir cambio | 🟡 | bugs conocidos |
| Objetivo y su estado (D1) | ✅ | #98 |
| Ejercicio / rutina | 🟡 | |
| Campana de avisos in-app | ✅ | correo (D3) ❌ |
| Cuota: aviso, "avisé que pagué"; impaga **no bloquea** (D2) | ✅ | |
| Ánimo/síntomas, rachas, push, app en tiendas, borrar cuenta desde app | ❌ | |

### 3.2 Panel de la nutricionista
| Función | Estado |
|---|---|
| Inicio (tablero) | 🟡 indicadores ❌ (PR #67 sin mergear) |
| Pacientes (lista + alta con invitación + archivar) | ✅ |
| Ficha del paciente (encabezado + pestañas) | 🟡 Planificación ✅ (#78); resto de las 8 pestañas de Nutriboost: ver plan v2 §4 |
| Planificación: IMC, referencias CDC, meta confirmada | ✅ · metabolismo basal, actividad, fórmulas alternativas ❌ |
| Editor semanal con análisis en vivo, versiones, publicar | ✅ |
| Impresión del plan | ✅ · PDF con logo/datos del consultorio ❌ |
| Alimentos (catálogo propio), Recetas con composición, Modelos | ✅ (Recetas solo por link directo) |
| Revisión de comidas (confirmar/ajustar) | ✅ |
| Seguimiento (centro de seguimiento) | ✅ |
| Progreso global de la cartera | ✅ (#93) |
| Agenda | 🟡 solo lectura; turnos en Consultas |
| Mensajes | 🟡 |
| Biblioteca / recursos editoriales | ✅ |
| Cobranzas por paciente (cuota manual) | ✅ · nuevo cobro/programas ✅ (#92) · Mercado Pago 🔶 (rama `respaldo/codex-nutridesk-core`) |
| Mediciones completas (composición, perímetros) | ✅ (#89) · segmental, bariátrico y laboratorio 🔶 (rama `respaldo/codex-nutridesk-core`) |
| Asistente IA (resumen de cada mañana + chat) | ❌ — es el diferencial del brief · Codex tiene un "asistente de cartera" 🔶 (consultas sobre agregados, sin resumen de la mañana) |
| Equivalencias, fórmulas alternativas, micronutrientes, PDF con marca | 🔶 PR #108 |
| Importar fichas viejas (CSV, Excel, Word, PDF, fotos) con OCR | 🔶 PR #107 |
| Consultas grabadas con borrador privado y resumen revisado | 🔶 PR #106 (IA externa apagada) |
| Agenda pública con reserva, varias agendas, Google Calendar/Meet, equipo y recepción | 🔶 rama `respaldo/codex-nutridesk-core` |
| Difusiones por WhatsApp, Centro de ayuda | 🔶 rama `respaldo/codex-nutridesk-core` |
| Página pública con paquetes y precios | ❌ (Codex tiene la página pública de reserva `/consultorio/<nombre>`) |

## 4. Fuera de alcance (decisión de Facu)
Dashboard móvil de la nutri y Academy (`PRODUCT.md`). WhatsApp como canal de avisos (D3).

## 5. Métricas de éxito
No hay métricas definidas en las fuentes. → Decisión abierta.

## 6. Decisiones abiertas para Facu
1. **Precio y modelo**: ¿plan gratis con 3 pacientes + cobro por paciente activo, o prueba con fecha? ¿Precios frente a Nutriboost (ARS 15.000/47.000/57.000)?
2. **Mercado Pago**: ¿cada nutri conecta su cuenta o cobra Plan V?
3. **Alternativas por comida**: la landing las promete; ¿se construyen ya o se baja la promesa?
4. **Páginas del menú que no existen** (Asistente IA, Equivalencias, Página pública, Centro de ayuda): ¿"próximamente" o recién cuando estén?
5. **Métricas de éxito del piloto** con Vero: ¿cuáles (pacientes activos, % comidas revisadas, retención)?
6. **Entidad legal y titular** (Facu, Vero o ambos), AAIP y contrato de encargo.
7. **Bases de alimentos** a cargar y licencias (USDA, SARA 2, ArgenFoods).
