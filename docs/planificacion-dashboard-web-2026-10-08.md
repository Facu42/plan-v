# Planificación nutricional web · 2026-10-08

Primer incremento implementado y verificado localmente en `codex/nutri-planificacion`, desde `187a48a`. No publicado. Migración de sincronización preparada y ensayada en PostgreSQL descartable, sin aplicar en producción.

## Decisiones de Facundo

- Se rechazó la maqueta independiente porque se apartaba de Nutrigo y resultaba demasiado sobria. Fue reemplazada por la pantalla real del consultorio, con sus componentes, tipografía, colores e iconos originales.
- «Que la actualización del objetivo del plan vaya en función al objetivo actualizado»: confirmar la meta actualiza automáticamente el objetivo del borrador. Si solo hay una versión publicada, crea un borrador conservando la publicada. Guardar una meta sin confirmar no modifica el plan.
- Desktop web únicamente; mobile y Academy siguen fuera.

## Contraste Nutriboost

Video https://www.loom.com/share/35b428b996314f9c8f5505de4a6297cb, revisado con `/browse` en 1:43 antes del incremento. Se observa pestaña Planificación, medidor de IMC, basal identificado con Mifflin-St Jeor, necesidades energéticas con actividad y cuadro actual/objetivo/referencia. Subtítulos tapan parte del cuadro. No acredita otras ecuaciones ni políticas de actualización de planes. Relevamiento visual autorizado en reemplazo de escucha.

## Diseño y herramientas

Nutrigo manda sobre las recomendaciones genéricas: Poppins, Cream-BG `#F9F4F2`, Green `#C2E66E`, Saffron `#FFCB65`, Orange `#FFA257`, sus tonos claros, componentes `NvMetric`, `NvBadge`, `NvButton` e iconos `NvIcon` provenientes del archivo. No se modifican los frames originales del paciente. Las ocho pestañas quedan en una fila a 1440.

Instalaciones globales, sin dependencias nuevas del producto:

- Emil Kowalski: 14 habilidades; aplicada `emil-design-eng`. Se conserva el movimiento breve y la respuesta de pulsación existentes; las cifras no se animan.
- [Impeccable](https://impeccable.style): instalado `impeccable`, referencia `778c8a7b71ccd5bfe3ca6ac68c15d9d872d0f87d`. Aplicados contexto, refinamiento del sistema existente y craft floor. Detector sobre los cambios visuales: `[]` (sin hallazgos mecánicos); no equivale a aprobación del usuario.
- [Taste](https://tasteskill.dev): instalado `design-taste-frontend`, referencia `b482f7a970abb98c4108d4a9f761e458c64cefc8`. Se leyó su alcance: explícitamente excluye dashboards, tablas y flujos complejos. No se trasladan sus reglas de marketing a este consultorio.
- [Layers](https://layers.jamiemill.com): instalados y leídos `layers-surface`, `layers-interaction-flow`, `layers-conceptual-model`, referencia `a201dc8c2011940b9d93934abb0f40c3b226c7ca`; intro leído desde origen. Aplicadas consistencia de objetos, vocabulario y feedback: meta propuesta → confirmada → objetivo del borrador → plan publicado separado.

| Antes | Después | Motivo |
| --- | --- | --- |
| Maqueta Inter y verde oscuro | Pantalla real con componentes Nutrigo | Respetar la identidad solicitada |
| Calculadora en antecedentes y evolución | Pestaña Planificación dentro de la ficha | Evitar edición duplicada dentro de la ficha |
| Unidad solo en placeholder | Etiqueta permanente con unidad | Visible con el campo completo |
| Meta confirmada separada del objetivo del plan | Actualización automática del borrador al confirmar | Decisión de Facundo, sin pasos manuales extra |
| Octava pestaña envuelta en otra fila | Ocho pestañas alineadas en escritorio | Navegación uniforme |

## Implementación

La calculadora existente se reubica sin cambiar sus ecuaciones. Mantiene datos corporales, revisión profesional, estados de carga/error y protección de cambios sin guardar. Evolución conserva sus objetivos de seguimiento; el editor calórico deja de duplicarse en esa sección de la ficha. Los accesos independientes existentes se mantienen.

Confirmar actualiza únicamente el borrador y su revisión. Si la última versión es publicada, copia comidas, recetas históricas, componentes, cantidades, fechas, notas e indicaciones a otra versión, con el nuevo objetivo. La publicada permanece intacta. Un plan creado después de confirmar también incorpora la meta vigente; el análisis del editor la muestra antes de guardar. Clientes con revisión o meta vencidas siguen rechazándose para evitar sobrescrituras.

Producción usa una transacción SQL para confirmar y sincronizar, con validación de usuario, pertenencia, revisión y bloqueos compartidos con los flujos de planes/IA. Se cierran las funciones anteriores después de renombrarlas; no se amplía el acceso anónimo. Demo conserva el mismo comportamiento.

## Verificación

- Pruebas nuevas primero fallaron en la ausencia de sincronización; pasaron después de implementar.
- Suite general: 306 archivos, 2.119 aprobadas, 2 omitidas. Tipos, compilación, seguridad de migraciones y secretos aprobados. Verificación final dirigida: 13 pruebas aprobadas y tipos aprobados.
- PostgreSQL descartable: sincronización de borrador, copia desde publicado, conservación de comidas/indicaciones, ausencia de actualización al guardar sin confirmar, revisiones obsoletas y otro profesional rechazados. Función anterior sin ejecución directa autenticada.
- Navegador local con datos ficticios: confirmación mediante el formulario creó borrador v5, objetivo 1.605 kcal y misma revisión que la meta confirmada; publicado v4 conservado. El análisis mostró 1.605 kcal, 108 g de proteínas, 174 g de hidratos y 53 g de grasas. Son datos de ensayo, no recomendaciones clínicas.
- 1440×1000 sin desborde horizontal. Las ocho pestañas tienen la misma coordenada vertical. Poppins y tokens crema/lima comprobados en estilos calculados. Capturas en `docs/evidencia-planificacion/`.
- Un primer intento de escritura local fue rechazado por el origen del entorno demo; se corrigió `CORS_ORIGINS` de ese proceso y se repitió exitosamente. No se cambiaron configuraciones productivas.
- `code-reviewer` revisó código y luego asumió revisión de realidad porque el otro agente agotó su límite de uso. Sin bloqueantes. Detectó el ensayo firmado con un acceso viejo: corregido para ir a Planificación después de revisar ingreso, conservando la comprobación de meta publicada.
- El ensayo firmado completo está actualizado, pero no se ejecutó en esta máquina: requiere su Supabase descartable. No se acredita como aprobado hasta CI.

## Pendientes del apartado completo

IMC y referencias por métrica, comparación clínica actual/objetivo/referencia y otras ecuaciones siguen pendientes. Se incorporarán tras contraste específico y fuentes primarias verificadas. No se presentan como terminados ni se inventan rangos desde una captura.

El enlace de propuesta anterior redirige al apartado real de prueba. Este incremento está listo para revisión de diseño; publicar y aplicar la migración productiva requieren autorización correspondiente. Sin llamadas pagas de IA, recursos nuevos ni cambios a pacientes reales.
