# IA de apoyo a la nutri para armar planes semanales (17/10/2026)

Estado: **encendida en producción desde el 17/10** (`AI_PLAN_ASSISTANT=on` en la API; sin la variable queda apagada), sin migraciones, sin cambios de pantalla. Rama `claude/project-thread-adfvy4`.

## Qué hace
El botón de siempre («Generar borrador con IA», en el plan de la paciente, hasta 21 días) pasa a proponer un
plan semanal completo cuando se enciende `AI_PLAN_ASSISTANT=on`. Además de las alergias, las restricciones, la
meta confirmada y las recetas publicadas, el modelo recibe una referencia armada por el servidor:

- **Alimentos de SARA 2** (valores por 100 g o 100 ml): hasta 8 por grupo de 11 grupos de uso diario, sin suplementos.
- **Equivalencias** de la nutri (hasta 12 grupos con al menos dos opciones).
- **Modelos publicados** de la nutri (planes, recomendaciones, alimentos a evitar; hasta 6 con 12 líneas cada uno).

La referencia tiene un tope de 12.000 caracteres (se recortan primero modelos, después equivalencias, después alimentos)
para entrar en el límite de 8.000 tokens de cada pedido. El resto del circuito no cambia: la propuesta queda como
borrador privado, la nutri la revisa y aprueba, y recién después se publica. Nada llega a la paciente solo.

## Seguridad con alergias
1. Se sacan de la referencia (alimentos, equivalencias y modelos) las líneas que nombran una alergia o restricción.
2. El mensaje al modelo las declara excluyentes.
3. Al volver la respuesta, si aparece un término bloqueado en cualquier ingrediente o título, se agrega una advertencia
   visible para la nutri («Revisá con cuidado: aparece «maní» en la propuesta»). No reemplaza su revisión.

## Tope de gasto (US$5 al mes)
El control está en el servidor (`server/ai/spend.ts`) y usa **la misma bolsa global de US$5 por mes** que ya usan las
demás funciones nuevas de IA (`clinical_ai_budget_months`). Antes de llamar al proveedor reserva el peor caso (todo el
contexto más el máximo de salida) y corta con un aviso si pasaría el tope. Al terminar cobra lo realmente gastado
(según los tokens que informa el proveedor) y libera el resto. Si la llamada falla sin respuesta confiable, la reserva
queda contada. Con modelos gratis el costo es cero y la bolsa no se toca.

Los precios salen de `AI_PRICE_INPUT_USD_PER_MTOK` y `AI_PRICE_OUTPUT_USD_PER_MTOK` (vacíos = gratis).
**Los modelos pagos siguen bloqueados** por `server/ai/cost-policy.ts`: la decisión de modelo, permisos y costo en
producción todavía no está tomada. Este cambio no los habilita.

## Cómo se prueba
- `npx vitest run server/ai server/ai-jobs` (alimentos sin alérgenos, equivalencias y modelos, tope de tamaño, tope de
  gasto, avisos de alérgenos y coincidencias con SARA 2, circuito completo con el asistente encendido y apagado).
- Con datos inventados y `AI_MODE=demo`: el borrador demo cubre todas las fechas y momentos, sin fingir una recomendación.
- En producción **no** se enciende nada sin la frase de Facundo y sin la prueba con modelos gratis y datos ficticios.

## Límites conocidos
- Las recetas nuevas que propone el modelo siguen sin cifras nutricionales confiables (contrato existente): se avisa
  cuántos ingredientes coinciden exactamente con SARA 2 y la nutri vincula el resto al revisar.
- Las transcripciones de consultas (#131) no se tocaron.
