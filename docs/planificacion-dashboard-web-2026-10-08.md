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

## Segundo incremento: IMC y referencias · 2026-10-08

Comparación visual repetida con el video de Nutriboost alrededor de 1:43: indicador de IMC, basal Mifflin-St Jeor, energía y tabla actual/objetivo/referencia. La captura no acredita una política clínica para fijar metas de peso ni suficientes datos para todas las referencias de composición corporal.

Se incorpora resumen de IMC siempre visible y detalle desplegable de peso/IMC, con los tokens Nutrigo, tabla semántica y apertura por teclado. Cerrado inicialmente para conservar el acceso cómodo a la calculadora. Es una extensión con componentes existentes; no hay un frame original de Nutrigo para este bloque. No se agrega movimiento a números ni al desplegable de uso frecuente.

Fuente primaria consultada con /browse: [CDC, Adult BMI Categories](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html). Cálculo peso kg / talla m²; clasificación sin redondear. Referencias generales desde los 20 años: <18,5; 18,5 a <25; 25 a <30; ≥30. El peso de referencia se deriva del intervalo 18,5 a <25 multiplicado por talla m². En menores de 20 se muestra solamente el cálculo, sin clasificación ni intervalo de adultos. La edad sigue siendo la de la propuesta existente. No se fijan automáticamente metas de peso, no se reemplaza evaluación profesional ni se cambia la meta energética o el plan por consultar referencias.

| Antes | Después | Motivo |
| --- | --- | --- |
| Sin indicador de IMC | Resumen numérico y categoría junto a planificación | Incorporar función observada en Nutriboost |
| Referencias pendientes sin fuente | Tabla con fuente CDC y límite de edad explícito | Evitar inventar rangos desde el video |
| Tabla completa desplaza formulario | Resumen visible y detalle desplegable | Mantener calculadora accesible |

Verificación: 14 pruebas nuevas de fórmula, límites sin redondear, edad e entradas no finitas; fallaron antes de crear el módulo. Suite: 307 archivos, 2.133 aprobadas y 2 omitidas. Tipos, compilación, migraciones y secretos correctos. Navegador ficticio local a 1440: temas claro/oscuro, sin desborde, apertura con mouse y cierre con Enter, cambio a 19 años sin clasificación adulta y regreso sin guardar. Evidencias en evidencia-planificacion/planificacion-imc*.png. No datos reales ni escrituras productivas.

El CI anterior encontró una carrera en el ensayo: navegación antes de terminar revisión de ingreso (guardado bloquea salir). Corregido en 69e8f13 esperando «Ya revisado». Controles generales repetidos aprobados; recorrido firmado todavía en ejecución al registrar esta actualización.

Pendiente: metas de peso definidas por profesional y comparación objetivo, otras medidas y referencias de composición corporal, fórmulas alternativas. No se acredita el apartado completo. Sigue en PR borrador #78, sin producción.

## Tercer incremento: comparación antes de confirmar · 2026-10-08

Se repitió el contraste visual con Nutriboost alrededor de 1:48: cuadro «Actual vs objetivo vs referencia». Nuestra extensión compara propuesta energética/macros con la meta confirmada que ve la paciente, sin presentar el gasto basal como ingesta registrada ni confundirlo con el plan publicado.

Decisión de Facundo: «Por ahora, conservar objetivos sin exigir un peso numérico». No se incorpora meta obligatoria de peso ni se deriva una desde el intervalo de referencia. Los objetivos de seguimiento existentes se conservan.

Tabla Nutrigo en el panel de propuesta: medida, vigente, propuesta y cambio. Se indican aumentos/reducciones/sin cambio, y guiones cuando aún no hay meta confirmada. No inventa cero ni publica al editar. Si el formulario está incompleto, la meta confirmada sigue disponible en su resumen anterior. No hay cambios de API, migraciones ni persistencia.

| Antes | Después | Motivo |
| --- | --- | --- |
| Dos bloques de macros sin diferencia explícita | Tabla con propuesta, meta vigente y variación | Facilitar revisión antes de compartir |
| Título Confirmada envuelve una letra en panel angosto | Vigente, explicado como meta que ve paciente | Lectura cómoda sin cambiar estructura Nutrigo |

Pruebas nuevas primero fallaron por módulo ausente; 3 dirigidas aprobadas después. Suite general: 308 archivos, 2.136 aprobadas, 2 omitidas. Tipos, compilación y secretos aprobados. Navegador local ficticio1440, sin desborde: ajuste -15 a -10 produjo 1605→1699 kcal (+94), proteína108 sin cambio, hidratos174→189 (+15), grasas53→57 (+4), conservando confirmada. Ajuste restaurado sin guardar/publicar. Captura del panel en evidencia-planificacion/comparacion-metas-1440.png. Revisión de código sin bloqueantes; revisión funcional local acreditada por recorrido y captura.

CI del incremento db09fd9 completamente aprobado, incluido signed-auth (5m56s). Este nuevo cambio se suma al PR #78 y repetirá CI. Sin aplicación a producción. Otras fórmulas, medidas de composición corporal y sus referencias permanecen pendientes de relevamiento específico y fuente primaria.
