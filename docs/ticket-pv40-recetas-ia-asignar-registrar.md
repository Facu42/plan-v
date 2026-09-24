# PV-40 — Recetas plantilla con IA, asignar al día y «Registrar esta comida»

**Estado:** pedido Facu 2026-09-21 (referencia visual reel Cenra). Aclaración del mismo día: la barra no es sólo el flujo; es el **formato visual**.  
**Prioridad:** P1 producto (después del smoke staging / gates humanos P0).  
**No es:** merge a `main`, SQL live con pacientes, ni aprobación visual Nutrigo.

## Referencia

- Reel: https://www.instagram.com/reel/DajVJcSxarK/
- Producto de referencia: Cenra (`app.cenra.com.ar` / @cenra.coach)
- Caption del reel: nueva funcionalidad que los coaches usan mucho.

## Qué se ve en el reel (flujo)

La barra incluye el formato de la card: ver [Bar visual / formato](#bar-visual--formato-no-negociable-en-el-ticket). **No clonar** assets ni marca Cenra.

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

## Bar visual / formato (no negociable en el ticket)

Aclaración Facu (2026-09-21): cerrar el circuito (IA → asignar → registrar) no alcanza. El ticket exige el **formato visual** del reel de Cenra — claridad y limpieza de una card SaaS premium. **No clonar** assets ni marca Cenra; sí ese nivel de lectura.

1. **Foto de plato generada o ilustrativa de alta calidad** en la card (estilo flat-lay / plato limpio, fondo neutro). Si la IA crea la receta desde descripción, debe proponer o generar una imagen coherente del plato (o un pipeline claro de imagen generada/seleccionada). Sin placeholders feos ni stock genérico chato.
2. **Macros legibles de un vistazo:** bloque limpio en la card con KCAL + PROT + CARBS + GRASAS, tipografía clara, labels cortos, jerarquía fuerte (números grandes / labels chicos). Referencia Cenra: grilla o fila compacta, color sutil por macro (ej. prot azul, carb naranja, grasa rojo) sin ruido.
3. **Card de biblioteca:** foto arriba → badge de categoría (Desayuno/Almuerzo/…) → título → meta (porciones · tiempo) → bloque macros → acciones Asignar / Editar. Mucho aire, bordes redondeados, tipografía sans moderna — sensación SaaS premium, no tabla densa.
4. **Wizard Nueva receta:** Paso 1/2 con elección Manual vs Asistente IA; lista de ingredientes editable (nombre, kcal de línea, cantidad/unidad) antes de confirmar; macros finales visibles y editables.
5. **Vista paciente:** misma claridad — foto + ingredientes + CTA «Registrar esta comida» sin saturar.

## Gap vs Plan V hoy (PV-18/19/20/22/27)

Ya tenemos catálogo de recetas, planes fechados, vista paciente del plan, diario persistente y jobs de IA. **Falta el circuito UX de plantilla → IA describe-plato → Asignar a día → CTA paciente «Registrar esta comida»** como en el reel (atajo de adherencia, no solo ver el plan), **y el formato visual de la card** (foto de plato de calidad + macros escaneables).

## Criterios de aceptación

- [x] Nutri crea receta **manual** o con **IA por descripción** (borrador; no publica sola).
- [x] Card de receta muestra macros calculados a partir de ingredientes (o marca fallo explícito si la IA no pudo).
- [x] **Asignar** a paciente + fecha (+ slot); el paciente lo ve en comidas del día.
- [x] Paciente: **Registrar esta comida** crea entrada de diario ligada a esa receta/asignación (idempotente; sin duplicar al reintentar).
- [x] Fail closed sin schema / sin clave IA: 501 o estado `failed` visible; sin macros inventados en silencio.
- [x] No aplicar migraciones a proyectos hosted con `patients` sin puerta humana.
- [x] Tests + check/check:migrations/build.
- [x] Card profesional muestra foto de calidad + macros en formato limpio escaneable (no párrafo ni tabla cruda). El pozo de foto es ilustración de revisión o «la foto no se generó»; no hay URL inventada.
- [x] Flujo IA produce (o adjunta) imagen de plato alineada a la receta, revisable por el nutri antes de asignar. Sin clave, `cover_status=failed` visible.
- [x] Macros con labels KCAL/PROT/CARBS/GRASAS legibles; valores por porción.
- [ ] Lumen/Iris review del formato card antes de cerrar el ticket (no basta que «funcione»).

## Fuera de alcance de este ticket

- Clonar branding/assets/marca de Cenra. El nivel de claridad y limpieza del formato sí entra en el ticket (ver «Bar visual»).
- Importar receta desde URL de Instagram/TikTok (posible P2 aparte).
- Aprobación visual Nutrigo (`PLANV_NUTRIGO_VISUAL`).

## Notas de implementación

Reusar PV-18 (recetas), PV-19/20 (plan/slots), PV-22 (diario), PV-27 (jobs IA). Preferir extensión de UX/API sobre un módulo paralelo. Numeración **PV-40** = siguiente ticket de producto pedido por Facu tras PV-39 OUT.
