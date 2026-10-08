# Modelos del consultorio: diseño y plan de acción

Objetivo: catálogo privado del profesional con Planes modelo, Recomendaciones y Alimentos a evitar. Rama `codex/nutri-modelos`, basada en Planes. Web solamente; mobile y Academy excluidos.

## Contraste previo

Loom Nutriboost revisado nuevamente en 431,136 segundos (7:11). Apartado Modelos propio; tres categorías, búsqueda, crear, tarjetas con borrador/publicado, publicar y aplicar a cliente, editar y eliminar. No se observa qué ocurre al aplicar sobre un plan existente. No atribuir escalado automático al video. Audio reemplazado por lo visible según decisión de Facundo.

## Diseño acordado

Ventanas como Alimentos/Recetas. Plan modelo desde una copia guardada seleccionada explícitamente, con fechas convertidas en días relativos y cantidades/notas ajustables. Encabezado del paciente y objetivo clínico personal fuera del modelo. El servidor copia la versión actual guardada del plan, comprobando su revisión; no permite elegir cualquier versión histórica. Las recetas dentro de esa copia conservan su versión y composición. El cliente no envía composición inventada. Recomendaciones/alimentos a evitar: listas editables. Borrador y publicado separados; editar publicado conserva copia vigente. Archivo confirmado, sin borrar documentos aplicados.

Facundo eligió: **aplicar crea un nuevo borrador, conserva la versión anterior y muestra cambios para revisión**. No publica ni notifica automáticamente. La copia del paciente se conserva hasta publicar. Cantidades sin escalado automático; fechas elegidas explícitamente. Las recomendaciones y alimentos a evitar se incorporarán al documento como indicaciones separadas.

## Plan de implementación

- [x] Relevar, elegir recorrido y separar rama.
- [x] Tipos y pruebas de copias/ajustes permitidos.
- [x] Catálogo en API/memoria y migración con propietario/revisiones.
- [x] Modelos en barra izquierda, categorías, búsqueda y ventanas.
- [x] Vista previa de aplicación de Planes modelo, nuevo borrador e historial conservado.
- [x] Aplicación de Recomendaciones y Alimentos a evitar como indicaciones separadas.
- [x] Verificar API, aislamiento, PostgreSQL descartable y navegador 1440/1280.
- [x] Revisiones de código/realidad; suite, tipos, compilación y migraciones.
- [x] Registrar evidencia y actualizar plan de acción/PR en borrador.

Arquitectura: componentes React existentes, Hono, tipos Zod y PostgreSQL; ECC para componentes/pruebas y Supabase para permisos. Sin dependencias nuevas de aplicación. Migración sólo preparada/probada localmente; no modificar producción sin autorización específica. Procedencia de IA conservada en planes copiados; no se observó generación directa de modelos con IA en este segmento.

## Incremento implementado: catálogo

Modelos en barra lateral, tres categorías con contadores, búsqueda por nombre/descripción, creación y edición en ventanas. Planes modelo desde la versión actual guardada elegida explícitamente, días relativos, cantidades y notas generales/de cada componente editables. Ingredientes escalados, preparación, versiones de recetas, fuentes/revisiones de alimentos y procedencia IA visibles en la revisión y copia publicada. Promedio diario sólo cuando hay datos completos; desconocidos no pasan a cero.

Publicación con confirmación y revisión vigente; editar publicado crea edición en borrador y conserva copia publicada. Archivo confirmado, sin eliminación física. Catálogo privado: lectura filtrada por profesional, escritura sólo mediante operaciones validadas, revisión para evitar pisar cambios, fuente resuelta por el servidor y acceso al paciente verificado también en base. Rechazo de composición enviada por el navegador. Estado demo amplía únicamente el dominio nuevo conocido y conserva recetas/planes anteriores al reiniciar.

El encabezado, fechas y objetivo clínico del paciente quedan fuera de la copia. **Las notas y textos libres no se anonimizan automáticamente:** se revisan antes de publicar; el formulario lo explicita. No hay selector de versiones históricas arbitrarias del plan.

En el cierre del catálogo la aplicación todavía estaba pendiente. El siguiente incremento, documentado debajo, incorpora la aplicación de Planes modelo. Publicar un modelo prepara una copia profesional; no entrega ni notifica un plan.

## Evidencia y validación

- Nutriboost, pantalla 7:11: [captura comparada](evidencia-modelos/nutriboost-modelos-0711.png).
- Revisión de cantidades/notas: [ventana 1440](evidencia-modelos/planv-revision-modelo-1440.png).
- Catálogo y edición v2 con copia publicada v1: [1440](evidencia-modelos/planv-catalogo-modelos-1440.png), [1280](evidencia-modelos/planv-catalogo-modelos-1280.png). Sin desbordamiento horizontal en 1280.
- Navegador, datos ficticios: plan origen conserva 40 g; modelo publicado v1 tiene 50 g; edición v2 tiene 55 g. Nota de componente conservada/revisable; listas de recomendaciones y evitar guardadas; cancelación del archivo conserva el registro, confirmación lo retira. Búsqueda y recarga verificadas. Copia publicada visible durante edición.
- Suite general: **273 archivos, 1520 pruebas aprobadas, 2 omitidas**. Última verificación dirigida tras reforzar acceso al paciente de origen: **6 archivos/22 pruebas aprobadas**. Incluye permisos de funciones en esquema completo, almacenamiento local descartable, revisión y conservación, fuente propia/actual, cantidades/gramos, notas y vista de revisión.
- Tipos, compilación, control de migraciones y revisión del cambio aprobados. Code-reviewer y reality-checker revisaron; se corrigió contenido oculto y la afirmación de copias históricas. Evidencia local: no certifica un despliegue productivo.

## Recorrido autorizado: aplicar al paciente

1. Contrastar nuevamente lo visible en Nutriboost sobre aplicar a cliente, sin inventar pasos no observados.
2. Elegir paciente y fechas; mostrar contenido que se incorporará y diferencias contra la versión actual, sin escalado automático.
3. Confirmar la copia publicada concreta del modelo y revisión actual del plan para evitar cambios concurrentes.
4. Crear **otra versión en borrador**, aun si ya existe un borrador; conservar su contenido anterior y hacerlo consultable en historial. Mantener el plan publicado del paciente vigente.
5. Integrar recomendaciones y alimentos a evitar como indicaciones separadas, visibles en revisión, copia publicada e impresión.
6. Revisión clínica y publicación explícitas mediante el recorrido existente. Comprobar permisos, conservación de versiones y copias frente a cambios del catálogo y de modelos.

No se considera cerrado todo Modelos ni todo el dashboard. Mobile y Academy continúan fuera del alcance.

PR en borrador: [#73 · Modelos web: catálogo y aplicación con historial](https://github.com/Facu42/plan-v/pull/73), basado en #72.

## Incremento implementado: aplicar Planes modelo (2026-10-07)

Contraste repetido antes de desarrollar: pantalla 7:11 muestra «Aplicar a cliente» en modelos publicados; el video pasa a Academy a los 440,890 segundos (7:21) sin demostrar la aplicación. El recorrido de comparación y nuevo borrador es una adaptación acordada con Facundo, no una función detallada observada en el video. La escucha pendiente fue reemplazada por evidencia visual por su instrucción.

Ventana con paciente y primer día elegidos explícitamente. Usa la copia publicada concreta del modelo, incluso si existe una edición posterior en borrador; muestra duración, comidas, ingredientes, cantidades, notas, versiones y diferencia por fecha/momento frente al plan actual. Confirmación explícita antes de crear otro borrador. Cantidades sin escalado automático; se conserva el objetivo nutricional del paciente, sin importar un objetivo personal del origen.

El guardado crea otra versión aunque ya haya un borrador, archiva el borrador anterior conservando su contenido y mantiene vigente la copia publicada del paciente. El historial profesional permite consultar versiones anteriores en modo de sólo lectura; se carga al abrirlo. Publicación y revisión clínica continúan mediante el recorrido existente, sin notificaciones automáticas. Se comprueban propietario, paciente, copia publicada y revisiones del modelo/plan; un cambio concurrente o repetición de la solicitud se rechaza para evitar sobrescrituras.

Verificación con datos ficticios en navegador: aplicación v1 del modelo con 50 g y nota revisada crea borrador v2; el historial v1 conserva 40 g. La edición v2 del modelo con 55 g no se aplica. En 1280 la comparación siguiente informa cero cambios y crear v3; se canceló, sin generar otra versión. Ventana y confirmación desplazables, sin desbordamiento horizontal.

Evidencia: [comparación 1440](evidencia-modelos/planv-aplicar-modelo-1440.png), [confirmación](evidencia-modelos/planv-confirmar-modelo-1440.png), [ventana 1280](evidencia-modelos/planv-aplicar-modelo-1280.png), [historial conservado](evidencia-modelos/planv-historial-modelo-1440.png), [video pasa a Academy 7:21](evidencia-modelos/nutriboost-posterior-modelos-0721.png).

Validación: suite general **273 archivos/1522 pruebas aprobadas y 2 omitidas**; después, **2 pruebas adicionales** de traslado entre meses, independencia de copia y diferencias por notas/porciones. Pruebas de memoria y esquema PostgreSQL completo validan acceso profesional, propiedad, confirmación, revisiones, nueva versión, historial y conservación de la copia publicada. Tipos, compilación y control de migraciones aprobados. Revisiones de código y realidad sin bloqueantes; evidencia local, sin aplicar la nueva migración en producción.

En este cierre parcial el siguiente incremento fue incorporar Recomendaciones y Alimentos a evitar al documento del paciente; quedó implementado el 2026-10-08, según registro debajo. No se cierra todo el dashboard. Academy y mobile siguen excluidos.

Nota de cierre (2026-10-08): el code-reviewer y reality-checker completaron la lectura funcional previa sin bloqueantes. La segunda revisión independiente de las capturas finales no pudo ejecutarse por límite de uso del agente. Las capturas finales fueron verificadas por el agente principal; no se presenta esa segunda revisión como completada.

## Indicaciones del plan: Recomendaciones y Alimentos a evitar (2026-10-08)

Contraste previo repetido del Loom en 431,022 segundos (7:11): muestra ambas categorías en Modelos, sin abrir el recorrido para aplicarlas. No se atribuye al video la comparación ni la forma de combinar listas. Facundo eligió agregar al nuevo borrador, conservar lo anterior y evitar duplicados. Los textos se comparan sin diferencias de mayúsculas ni espacios consecutivos; se conserva la redacción previa. No se equiparan instrucciones distintas ni se inventan recomendaciones clínicas.

Implementado: Aplicar al paciente disponible para las tres categorías publicadas. Recomendaciones/evitar requieren un plan guardado: crean otra versión del mismo período, copian comidas, cantidades, composición histórica y objetivo clínico sin modificarlos, suman únicamente la categoría elegida y conservan el publicado/historial. Revisión previa de lista resultante y cantidad de indicaciones nuevas. Límite de 100 por categoría/500 caracteres por indicación; modelo hasta 50. Los borradores y copias publicadas posteriores del catálogo no alteran documentos ya copiados.

Las listas se pueden ajustar en el borrador y guardar; la revisión para publicar incluye su contenido y evita cambios concurrentes. Publicación/entrega siguen siendo explícitas. Se incorporan al documento publicado que se consulta y a la impresión, y aparecen también en versiones anteriores. Al guardar comidas o aplicar otro Plan modelo se conservan las indicaciones. La base protege las listas de versiones publicadas/archivadas contra modificaciones. Migración preparada mediante CLI y probada en esquema PostgreSQL completo, sin producción.

Revisión de comodidad con Facundo: se detectaron campos sin delimitación visual; se frenó el ajuste y se mostró una propuesta. Aprobó bloque desplegable con dos campos claramente delimitados. El estilo se incorpora al editor existente usando sus colores y foco de teclado; no se crea otro sistema visual. Se mantiene ECC selectivo para composición, formularios y verificación.

Pruebas: suite completa **274 archivos/1527 aprobadas, 2 omitidas**; tipos, compilación y control de migraciones aprobados. Pruebas de memoria, PostgreSQL, aislamiento, revisión para publicar y documento imprimible con escape de texto. Code-reviewer sin bloqueantes; comprobación visual y revisión de realidad se registran en el cierre de este incremento.

Evidencia ficticia: recomendaciones crean v3 con dos líneas; evitar crea v4 con una línea y conserva las recomendaciones. Al volver a aplicar informa 0 nuevas; se canceló sin crear v5. La comida mantiene 50 g y receta v1; la impresión v4 muestra ambas categorías. Se revisó 1440/1280 sin desbordamiento horizontal. Capturas en evidencia-modelos con prefijo planv-indicaciones, planv-recomendaciones y planv-evitar.

Este incremento completa el recorrido básico de las tres categorías de Modelos en la web. No cierra todo el dashboard. Pendientes generales de impresión: identidad profesional persistente/logo, tablas nutricionales y descarga directa; se conserva Imprimir/Guardar como PDF mediante navegador. Academy/mobile siguen fuera de alcance.

Cierre: reality-checker verificó 12 pruebas dirigidas y capturas de revisión, deduplicación e impresión, sin bloqueantes. Tras aprobar el ajuste visual, se comprobó edición/guardado de una tercera recomendación ficticia en v4, conservando alimento 50 g; las dos listas quedaron en campos con borde visible y foco de teclado. El plan demo no se publicó por estar su ingreso pendiente: la entrega publicada se validó en base descartable.

Capturas de este incremento: [comparación Nutriboost](evidencia-modelos/nutriboost-indicaciones-previa.png), [recomendaciones](evidencia-modelos/planv-recomendaciones-aplicar-1440.png), [evitar](evidencia-modelos/planv-evitar-aplicar-1440.png), [sin duplicados 1280](evidencia-modelos/planv-indicaciones-dedup-1280.png), [editor aprobado](evidencia-modelos/planv-indicaciones-editor-1440.png), [impresión](evidencia-modelos/planv-indicaciones-impresion-1440.png).

La revisión de menús IA muestra también las indicaciones conservadas y las compara antes de publicar; un cambio posterior requiere volver a revisar. Historial verificado: [versión anterior](evidencia-modelos/planv-indicaciones-historial-1440.png).
