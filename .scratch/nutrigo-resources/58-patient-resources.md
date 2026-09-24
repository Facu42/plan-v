# Corte 58 — Recursos paciente

## Alcance

- `Recursos` deja de mostrar **Pronto** y abre una superficie Nutrigo propia.
- La biblioteca incluye seis guías originales sobre el uso de Plan V: Plan semanal, Diario, Compras, Mensajes/Agenda, Progreso y Actividad.
- Incluye destacado, categorías, búsqueda, detalle, secciones, etiquetas, relacionadas y navegación a la función explicada.
- El guardado se mantiene aislado por paciente en `localStorage` bajo `plan-v:resource-favorites:<patientId>` y se rotula como conveniencia de este dispositivo.

## Límites

- Las guías son ayuda operativa, no contenido clínico ni recomendaciones generadas automáticamente.
- No se copiaron textos, autores, cifras, identidades ni imágenes de la referencia Nutrigo.
- No existe todavía entidad persistida de artículo, autoría profesional, revisión editorial, asignación, lectura, URL estable ni compartir.
- No se presenta el guardado local como sincronización clínica.
- No se aplicó `supabase/contracts/016_plan_v_contract_draft.sql`.

## Referencia visual

- Biblioteca: frame Insights `263:6588`.
- Detalle: frame Insight Details `279:9301`.
- Se conservó el shell Plan V de 223 px, composición central con rail contextual, Poppins local y temas claro/oscuro.

## Verificación

Browser QA aislado en `3014`, `5184` y Chrome `9241`:

```json
{"checks":["biblioteca","filtros","detalle","guardado-local","navegacion","privacidad","responsive-temas"],"views":4,"saved":["leer-plan-semanal"],"errors":[]}
```

- Seis guías renderizadas.
- Búsqueda y categoría aisladas.
- Detalle con tres secciones y dos relacionadas.
- Guardado leído desde la clave del paciente `pat-sofia`.
- Navegación contextual a Plan semanal.
- Sin `note_for_nutri`, `goal_history` ni Plan B profesional.
- Sin overflow horizontal en 1440 ni 390.
- Tema claro y oscuro verificados.

Capturas inspeccionadas:

- `resources-light-1440.png`.
- `resources-dark-390.png`.

Gate global:

- 60 archivos de prueba.
- 134 suites aprobadas.
- 308/308 pruebas aprobadas.
- TypeScript frontend/servidor aprobado.
- Build de producción: 121 módulos.
- `npm audit`: 0 vulnerabilidades.
- 91 paquetes con firmas verificadas y 46 con attestations verificadas.
- `git diff --check`: aprobado; sólo se mantienen los avisos existentes de conversión LF→CRLF en `PatientCamino.tsx` y `PatientMessages.tsx`.

## Estado

- La base paciente de Recursos está operativa.
- El contenido editorial clínico, biblioteca profesional, asignación, lectura, guardado unificado, URLs estables y compartir continúan pendientes de contrato y reglas de producto.
- La aprobación visual global de Plan V continúa abierta.
- No hubo commit ni push.
