# Consultas: incorporación de MAIN · 15/10/2026

PR106 incorpora por merge la primera entrega revisada `a6ab13ae2ca65e39a0ed487fe254c26b0aac5d80`, que contiene MAIN `2d31f9ddc70d08dead50c26295a409bde16ac960`. No hubo conflictos ni cambios funcionales adicionales. Los siete PR de MAIN de vistas, síntomas, coordinación, guías, recorridos/monitor, avisos y compras se conservan. Los 25 JSON originales de Nutrigo no cambian; package y lockfile son los de PR105 actualizado. CI conserva e2e y monitor y agrega únicamente el control sintético de secretos que ya pertenecía a consultas.

## Regression Guard (pasos 1–10)

1. **Flujos:** consultas privadas/compartidas, permisos, reintentos y presupuesto, acceso/cartera heredados y nuevos hábitos/avisos/compras cubiertos en la suite local. Captura nativa de ambas voces, correo recibido y proveedor real no se ensayaron en esta sincronización.
2. **Regresiones:** se conservan los casos de borradores, paginación, revisión, retiro de consentimiento, gasto incierto y preservación de los cambios de MAIN. No se eliminó ni debilitó una prueba.
3. **Contratos:** unión automática conserva tipos/esquemas de síntomas y consultas, teléfono, API, autorización, worker y privacidad. Sin cambios de contratos nuevos.
4. **Acoplamiento:** fuente compartida de CSS conserva el gris original de Nutrigo y sus usos legítimos; CI conserva los recorridos de MAIN.
5. **Migraciones:** las tres de consultas siguen aditivas y sin aplicar por este trabajo. Las dos SQL de MAIN ya observadas aplicadas se conservan intactas, no se ofrecen de nuevo como pendientes. Reversión operativa apaga procesamiento y conserva notas, versiones, tablas y ledger.
6. **Gates actuales:** **2.617 PASS, 0 FAIL, 2 omitidas, 389 archivos**, maxWorkers=2. Tipos web/servidor/e2e, build **11,09 s**, migraciones, vistas locales y límites de secretos PASS; instalación reproducible sin scripts y auditoría 0 vulnerabilidades. Diferencias propias contra PR105 sin espacios inválidos. El diff del merge incluye cuatro espacios finales preexistentes del documento ajeno docs/producto/02-TRD.md; se conserva ese archivo idéntico a MAIN.
7. **Áreas frágiles:** captura y proveedor externo, permisos que cambian durante procesamiento, gasto global y reinicios. Se preservan guardas, tokens, revisión y resultados persistidos; no se activan servicios.
8. **Fire test:** se conserva la prueba previa de gasto incierto de consultas y el RED→GREEN de selectores de gris de PR105 (1 RED, restauración 7 GREEN); esta sincronización no añade lógica funcional. Control positivo del scanner real ejecutado en esta copia.
9. **Automatización:** gates CI heredados, e2e/monitor de MAIN, catálogos de tablas/funciones y canario de secretos. Escaneo real: **571 commits, 78,77 MB**, más dos objetos grandes en 54 fragmentos solapados, **54,94 MB**, sin hallazgos; salida redactada.
10. **Veredicto:** listo para revisión del merge de la entrega. Sin merge a MAIN, SQL remoto, publicación, envío de correo o llamada real a Groq. Los PASS de CI de la cabeza antigua 66fe1e03 son históricos: la cabeza nueva exige su propio CI.

Evidencia TEMP: planv-release2-main-sync-full-20261015.json; logs con prefijo planv-release2-main-sync- para tipos/build/migraciones/vistas/secretos/instalación, control positivo y escaneo. No incluye datos de salud reales ni credenciales.