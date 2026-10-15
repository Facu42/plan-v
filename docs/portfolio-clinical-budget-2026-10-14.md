# IA de cartera dentro de la bolsa global · 14/10/2026

Corrección local en `codex/nutridesk-core`, sobre `da070fbe7a5a8145985d9d8096d9ac21c0758d0f`. Sin publicación, consultas reales a proveedores ni cambios de SQL/configuración. Corresponde a la entrega7; los snapshots3/4/5/6 no se modifican.

## Problema y resultado

El nuevo asistente de cartera usaba el modelo pago heredado mediante AI SDK, sin pasar por la bolsa de USD5 para IA nueva ni por las verificaciones de Groq. Una prueba HTTP reprodujo que, con clave Groq ausente y retención cero sin confirmar, todavía devolvía una respuesta IA (`ai` donde debía mantener `local`).

Ahora sólo llama a Groq `openai/gpt-oss-120b`, con retención cero verificada y modo gratuito verificado o pago explícito. En pago usa el mismo ledger global `ClinicalBudget` de consultas/importación: reserva atómica antes de llamar y liquida el consumo informado por el proveedor. Uso ausente, cero, inválido, superior a la reserva o respuesta perdida conserva estado incierto; no libera saldo posiblemente gastado. No existe fallback a OpenAI ni un presupuesto por consultorio.

La pantalla asigna un UUID a cada consulta y lo conserva al fallar o volver a indicadores locales. La clave del ledger deriva de actor, consultorio y ese UUID; cambiar el contenido de un reintento no salta una reserva anterior. Estados reservado, cobrado o incierto impiden otro envío. Una nueva consulta explícita podrá consumir presupuesto disponible. No se guarda respuesta IA ni se usa un falso trabajo de consulta para guardar cache: perder una respuesta cobrada requiere revisar el aviso y conservar los indicadores, sin repetirla automáticamente.

El proveedor recibe sólo intención clasificada y seis totales de un mínimo de cinco pacientes con ambos permisos vigentes: vínculo asistencial y seguimiento IA. Nunca recibe nombres, IDs, fuentes individuales ni pregunta libre. Antes del envío, después de reservar y después de recibir se comprueban nuevamente consultorio, pacientes activas, consentimientos y fingerprint de agregados/fuentes. La retirada o transferencia descarta las propuestas. Si una operación falla, también se reconstruyen las fuentes locales para no devolver pacientes del alcance anterior.

## ECC y Regression Guard · paso10

1. **Flujos:** asistencia local; gates Groq; mínimo cinco; ambos permisos; reserva global; uso real; modo gratuito; peticiones concurrentes; reintento incierto/cobrado; retirada y transferencia. Focal propio45 pruebas/7 archivos, cero fallos. Datos y fetch ficticios.
2. **Regresiones:** RED HTTP reprodujo el salto al modelo pago heredado. Provider nuevo inicialmente ausente (RED); implementación mínima y focal GREEN. Dos carteras cerca del límite comparten el saldo reservado por otra operación nueva y sólo una entra mientras se espera la respuesta.
3. **Contratos:** request_id opcional para compatibilidad; sin ID se devuelven indicadores y aviso, sin llamar IA. ai_notice opcional agrega el aviso comprensible. Se conservan answer/proposals/sources/mode y el mínimo de agregación. Budget y contratos clínicos2/documentales3 intactos.
4. **Acoplamiento:** nuevo adaptador de cartera sólo reutiliza reserve/readState/settle de ClinicalBudget. No usa chargeResult de tareas de consulta ni guarda PHI. Autorización fresca sigue en la API, derivada de la sesión.
5. **Migraciones:** ninguna. Manifiesto17 intacto. Sin cuentas, permisos nuevos, proveedor habilitado ni configuración productiva.
6. **Verificación:** focal45 PASS; tipos check exit0, build exit0(23,30s), secretos boundary ok y diff-check exit0 posteriores al cambio. Suite completa nueva pendiente del integrador; no atribuir la anterior2848 a este cambio.
7. **Áreas frágiles:** cobro tras timeout, reintento después de respuesta perdida y permisos durante envío. Estado incierto conserva la reserva; consumo válido se liquida aunque contenido o permisos fallen; la API elimina propuestas y actualiza fuentes.
8. **Fire test:** se desactivó temporalmente la autorización posterior al proveedor únicamente en el módulo local y con fetch ficticio. La prueba de retirada falló porque obtuvo propuestas. Restauración en finally; focal45 volvió a GREEN. No quedó mutación temporal.
9. **Automatización:** request UUID estable, reservas globales, consumo validado, rechazo de reintento y fingerprint de autorización. Avisos mantienen disponible el recorrido manual sin activar servicios externos.
10. **Veredicto:** preparado para revisión independiente de ROOT y gate integrado actualizado. Producción sigue pendiente de configuración/verificación de Groq y autorización específica. No declarar IA en vivo ni PlanV completo.

## Evidencia reproducible
- RED HTTP: `%TEMP%/planv-portfolio-budget-http-red-20261014.log`.
- Fire RED: `%TEMP%/planv-portfolio-budget-fire-red-20261014.log`.
- GREEN: `%TEMP%/planv-portfolio-budget-focal-20261014.json` (45PASS,0fail,7files).
- Check: `%TEMP%/planv-portfolio-budget-check-20261014.log`.
- Build: `%TEMP%/planv-portfolio-budget-build-20261014.log`.
- Secretos: `%TEMP%/planv-portfolio-budget-secrets-20261014.log` (boundary ok).
- Seis archivos de código/pruebas verificados UTF8 con NodeisUtf8=true y U+FFFD=0; sin conversión global ni modificación de otros módulos.


## Cierre integrado y revisión independiente

ROOT ejecutó 52 casos focales con persistencia/manifiesto y la suite global posterior de 2.886 aprobadas, cero fallos y dos omitidas (442 archivos). Tipos, build28,36s, diecisiete migraciones/manifiesto, vistas y secretos aprobaron. [Revisión independiente](portfolio-independent-review-2026-10-14.md): 33 casos en cinco archivos, sin P1/P2 pendientes. Las cuentas focales no se suman a la suite. Fuente8SARA2 no pertenece a esta suite. Sin llamadas reales, claves expuestas ni proveedor activado.
