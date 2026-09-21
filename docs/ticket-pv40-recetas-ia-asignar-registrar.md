# PV-40 — Recetas plantilla con IA, asignar al día y «Registrar esta comida»

**Estado:** pedido Facu 2026-09-21 (referencia visual reel Cenra).  
**Prioridad:** P1 producto (después del smoke staging / gates humanos P0).  
**No es:** merge a `main`, SQL live con pacientes, ni aprobación visual Nutrigo.

## Referencia

- Reel: https://www.instagram.com/reel/DajVJcSxarK/
- Producto de referencia: Cenra (`app.cenra.com.ar` / @cenra.coach)
- Caption del reel: nueva funcionalidad que los coaches usan mucho.

## Qué se ve en el reel (flujo a copiar en espíritu, no clonar UI/marca)

1. **CRM profesional — biblioteca Recetas**  
   Plantillas de comida para dietas de pacientes. Cards con foto, título y macros (kcal, prot, carb, grasas). Acciones **Asignar** y **Editar**.

2. **Nueva receta — Paso 1 de 2**  
   Dos caminos:
   - **Carga manual:** ingredientes y pasos a mano.
   - **Asistente IA:** «Describí el plato y [la app] completará todo por vos automáticamente» (ingredientes + cantidades + macros).

3. **Asignar**  
   Elegir paciente y **para qué día** (y, implícito, slot de comida). Overlay: «Así lo ve tu asesorado».

4. **App paciente — Comidas del día**  
   Card de la receta asignada (foto, ingredientes) y CTA **«Registrar esta comida»** (one-tap al diario, sin re-tipear el plato).

## Gap vs Plan V hoy (PV-18/19/20/22/27)

Ya tenemos catálogo de recetas, planes fechados, vista paciente del plan, diario persistente y jobs de IA. **Falta el circuito UX de plantilla → IA describe-plato → Asignar a día → CTA paciente «Registrar esta comida»** como en el reel (atajo de adherencia, no solo ver el plan).

## Criterios de aceptación

- [ ] Nutri crea receta **manual** o con **IA por descripción** (borrador; no publica sola).
- [ ] Card de receta muestra macros calculados a partir de ingredientes (o marca fallo explícito si la IA no pudo).
- [ ] **Asignar** a paciente + fecha (+ slot); el paciente lo ve en comidas del día.
- [ ] Paciente: **Registrar esta comida** crea entrada de diario ligada a esa receta/asignación (idempotente; sin duplicar al reintentar).
- [ ] Fail closed sin schema / sin clave IA: 501 o estado `failed` visible; sin macros inventados en silencio.
- [ ] No aplicar migraciones a proyectos hosted con `patients` sin puerta humana.
- [ ] Tests + check/check:migrations/build.

## Fuera de alcance de este ticket

- Clonar branding/assets de Cenra.
- Importar receta desde URL de Instagram/TikTok (posible P2 aparte).
- Aprobación visual Nutrigo (`PLANV_NUTRIGO_VISUAL`).

## Notas de implementación

Reusar PV-18 (recetas), PV-19/20 (plan/slots), PV-22 (diario), PV-27 (jobs IA). Preferir extensión de UX/API sobre un módulo paralelo. Numeración **PV-40** = siguiente ticket de producto pedido por Facu tras PV-39 OUT.
