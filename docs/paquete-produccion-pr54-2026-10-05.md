# Paquete de producción del PR #54

Preparado el 5 de octubre de 2026. **Aprobado por Facundo y aplicado sin modificar los cinco archivos.** Las versiones reales de Supabase, el commit publicado y las comprobaciones están en [publicación y cierre](publicacion-producto-plan-v-2026-10-05.md).

Código y SQL del paquete: `66c4fbfd4c803b16f3883e53089fa8974e077be5`. Las cinco migraciones se aplican en el orden de la tabla. Los SHA-256 identifican los bytes del archivo en Git (saltos LF), no una conversión de saltos de línea de Windows.

| Archivo | Función | SHA-256 en Git |
|---|---|---|
| [20261003172112_separate_nutrition_target_drafts.sql](../supabase/migrations/20261003172112_separate_nutrition_target_drafts.sql) | Borrador privado y meta publicada | `8f720241361457b66533d4aaa7c110f72c76df970ab4f925370f83e3a7e08ea7` |
| [20261003172907_structured_menu_nutrition.sql](../supabase/migrations/20261003172907_structured_menu_nutrition.sql) | Propuestas estructuradas y nutrientes estimados | `2170cfb3da7b89193033fe397719ae9a2df2da323019fedb78f112ef9589516c` |
| [20261003174117_manual_recipe_cover.sql](../supabase/migrations/20261003174117_manual_recipe_cover.sql) | Subida manual de portada | `6a1b3544649e6533be4174c38f15e4305a4d0a1c5f06346f495624f5074def02` |
| [20261003231922_reopen_patient_intake.sql](../supabase/migrations/20261003231922_reopen_patient_intake.sql) | Corrección de ficha enviada | `d4473819901ea5f25fed3726c7507bd670bce2c56700e46b7dcf3840959933a1` |
| [20261005002314_harden_product_writes.sql](../supabase/migrations/20261005002314_harden_product_writes.sql) | Revisiones, escrituras atómicas y favoritos existentes | `93ebfc16df16b9c6e363fd98fb22f17ef89dcbbffaa96537b08dcc8fd3df42e5` |

## Configuración y publicación incluidas

Sobre los servicios existentes de API y worker en Railway: `AI_MODE=live`, `AI_COST_MODE=free` y `OPENROUTER_MODEL=openrouter/free`, conservando la clave de OpenRouter ya configurada y las demás variables. El código rechaza modelos pagos y limita el precio a cero en cada petición. No se habilitan fotos con IA ni Higgsfield.

Se fusiona el PR revisado a main y se comprueba que Vercel, API y worker publican el mismo commit resultante de esa fusión. Se mantienen el proyecto, los buckets y los recursos actuales de Supabase; no se contratan servicios ni se amplía su capacidad.

## Comprobación después de la aprobación

1. Comprobar versión y migraciones existentes y aplicar sólo las cinco de este paquete mediante el MCP. No modificar su SQL durante la aplicación: un cambio exige nueva revisión del paquete.
2. Publicar y comprobar el mismo commit en los tres servicios, sus controles de salud y las rutas privadas al recargar.
3. Ensayar con las cuentas ficticias existentes: meta confirmada, receta/plan revisados, consulta y registro paciente, seguimiento profesional, archivos, turnos y pagos manuales.
4. Completar una propuesta de texto gratuita real, editarla, revisar y publicar exactamente la versión aprobada. Conservar la etiqueta de estimación. Agotamiento o indisponibilidad se registra como pendiente, sin activar un modelo pago.
5. Subir una foto ficticia de plato y comprobar su apertura pública real HTTPS. La pila temporal HTTP no sustituye esta prueba.

Las migraciones conservan los datos existentes. La quinta convierte favoritos con el contrato anterior y conserva el más antiguo si ya existían duplicados. Los títulos históricos se inicializan con el disponible: no se reconstruye un historial inexistente. Un cliente antiguo que guarde sin revisión debe recargar. Ante un fallo se detiene el cierre y se prepara una corrección que conserve los datos; no se eliminan registros publicados para deshacer el cambio.

La evidencia previa y los límites se registran en [cierre funcional](cierre-funcional-plan-v-2026-10-05.md); los endpoints y la guía de ambos roles en [recorridos y contratos](recorridos-y-contratos-plan-v-2026-10-05.md).

La regla 4 de [las reglas del proyecto](agentes/reglas-plan-v.md) dice: «Cualquier cambio en la base de producción, en la configuración de producción o en servicios pagos necesita antes el OK escrito de Facundo». Este archivo presenta el paquete para esa aprobación y no la reemplaza.
