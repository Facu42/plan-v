# PV-44 · revisión visual para Facu

Fecha: 2026-09-24. Referencia: frame `12:792` del [archivo Nutrigo en Figma](https://www.figma.com/design/OTolnKfsxUFjaZOhhdb04i/Nutrigo---Nutrition---Diet-Dashboard?node-id=12-792). Captura de la app tomada en modo demo a 1440 px desde esta rama. El preview de Vercel entregó la pantalla de acceso de Vercel al navegador de revisión, por lo que la comparación usa la app local con el mismo código del PR.

| Referencia Figma | App Plan V |
| --- | --- |
| [Dashboard del frame](../design/pv44-review/figma-dashboard.png) | [Dashboard local a 1440 px](../design/pv44-review/app-dashboard-1440.png) |

La grilla general coincide: sidebar de ~223 px, cuatro indicadores, dos paneles centrales, tres cards de seguimiento y rail derecho. Plan V conserva los datos y el copy propios: consulta próxima, adherencia, comidas revisadas y estados sin datos. Esas diferencias explican parte de la altura y densidad distintas frente al archivo. El rail y el bloque de seguimiento mantienen la jerarquía de la referencia.

## Card de receta · barra PV-40 / Cenra

El [reel de Cenra](https://www.instagram.com/reel/DajVJcSxarK/) sigue siendo la referencia de claridad de foto, macros y acciones; el contrato de producto detallado está en [PV-40](ticket-pv40-recetas-ia-asignar-registrar.md). Instagram mostró el reel pero interrumpió el acceso con un diálogo de inicio de sesión, así que esta revisión visual se basa en el contrato documentado y en una receta sintética creada en la app local.

[Card de receta tras el ajuste a 1280 px](../design/pv44-review/recipe-card-after.png): foto/ilustración, título, categoría, estado, rinde, ingredientes, pasos y cuatro macros quedan legibles; la acción Publicar aparece separada. Se corrigió el ancho fijo de la imagen destacada, que comprimía el bloque de detalles hasta partir “1 porción” en vertical. En modo demo la ilustración dice que no hay foto generada; una portada real depende de `AI_MODE=live` y de `OPENAI_API_KEY`.

Facu aprobó el gate visual Nutrigo el 2026-09-24. Se configuró `PLANV_NUTRIGO_VISUAL=1` en los servicios API y worker de Railway, proyecto `plan-v`, entorno llamado `production` (la app corre con `APP_MODE=staging`). La variable registra la firma humana en el acta de piloto; no habilita por sí sola el go-live. La parte mobile queda como siguiente pase de diseño y QA. La aprobación visual de Lumen/Iris indicada en PV-40 también requiere su revisión; este documento registra el chequeo local y la corrección de legibilidad, sin atribuirles una aprobación.
