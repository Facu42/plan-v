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
- [ ] Vista previa de aplicación, nuevo borrador e historial conservado.
- [x] Verificar API, aislamiento, PostgreSQL descartable y navegador 1440/1280.
- [x] Revisiones de código/realidad; suite, tipos, compilación y migraciones.
- [x] Registrar evidencia y actualizar plan de acción/PR en borrador.

Arquitectura: componentes React existentes, Hono, tipos Zod y PostgreSQL; ECC para componentes/pruebas y Supabase para permisos. Sin dependencias nuevas de aplicación. Migración sólo preparada/probada localmente; no modificar producción sin autorización específica. Procedencia de IA conservada en planes copiados; no se observó generación directa de modelos con IA en este segmento.

## Incremento implementado: catálogo

Modelos en barra lateral, tres categorías con contadores, búsqueda por nombre/descripción, creación y edición en ventanas. Planes modelo desde la versión actual guardada elegida explícitamente, días relativos, cantidades y notas generales/de cada componente editables. Ingredientes escalados, preparación, versiones de recetas, fuentes/revisiones de alimentos y procedencia IA visibles en la revisión y copia publicada. Promedio diario sólo cuando hay datos completos; desconocidos no pasan a cero.

Publicación con confirmación y revisión vigente; editar publicado crea edición en borrador y conserva copia publicada. Archivo confirmado, sin eliminación física. Catálogo privado: lectura filtrada por profesional, escritura sólo mediante operaciones validadas, revisión para evitar pisar cambios, fuente resuelta por el servidor y acceso al paciente verificado también en base. Rechazo de composición enviada por el navegador. Estado demo amplía únicamente el dominio nuevo conocido y conserva recetas/planes anteriores al reiniciar.

El encabezado, fechas y objetivo clínico del paciente quedan fuera de la copia. **Las notas y textos libres no se anonimizan automáticamente:** se revisan antes de publicar; el formulario lo explicita. No hay selector de versiones históricas arbitrarias del plan.

La aplicación al paciente todavía está pendiente: este incremento no expone un botón que simule aplicar ni modifica sus planes. Publicar un modelo prepara una copia profesional; no entrega ni notifica un plan.

## Evidencia y validación

- Nutriboost, pantalla 7:11: [captura comparada](evidencia-modelos/nutriboost-modelos-0711.png).
- Revisión de cantidades/notas: [ventana 1440](evidencia-modelos/planv-revision-modelo-1440.png).
- Catálogo y edición v2 con copia publicada v1: [1440](evidencia-modelos/planv-catalogo-modelos-1440.png), [1280](evidencia-modelos/planv-catalogo-modelos-1280.png). Sin desbordamiento horizontal en 1280.
- Navegador, datos ficticios: plan origen conserva 40 g; modelo publicado v1 tiene 50 g; edición v2 tiene 55 g. Nota de componente conservada/revisable; listas de recomendaciones y evitar guardadas; cancelación del archivo conserva el registro, confirmación lo retira. Búsqueda y recarga verificadas. Copia publicada visible durante edición.
- Suite general: **273 archivos, 1520 pruebas aprobadas, 2 omitidas**. Última verificación dirigida tras reforzar acceso al paciente de origen: **6 archivos/22 pruebas aprobadas**. Incluye permisos de funciones en esquema completo, almacenamiento local descartable, revisión y conservación, fuente propia/actual, cantidades/gramos, notas y vista de revisión.
- Tipos, compilación, control de migraciones y revisión del cambio aprobados. Code-reviewer y reality-checker revisaron; se corrigió contenido oculto y la afirmación de copias históricas. Evidencia local: no certifica un despliegue productivo.

## Siguiente incremento autorizado: aplicar al paciente

1. Contrastar nuevamente lo visible en Nutriboost sobre aplicar a cliente, sin inventar pasos no observados.
2. Elegir paciente y fechas; mostrar contenido que se incorporará y diferencias contra la versión actual, sin escalado automático.
3. Confirmar la copia publicada concreta del modelo y revisión actual del plan para evitar cambios concurrentes.
4. Crear **otra versión en borrador**, aun si ya existe un borrador; conservar su contenido anterior y hacerlo consultable en historial. Mantener el plan publicado del paciente vigente.
5. Integrar recomendaciones y alimentos a evitar como indicaciones separadas, visibles en revisión, copia publicada e impresión.
6. Revisión clínica y publicación explícitas mediante el recorrido existente. Comprobar permisos, conservación de versiones y copias frente a cambios del catálogo y de modelos.

No se considera cerrado todo Modelos ni todo el dashboard. Mobile y Academy continúan fuera del alcance.

PR en borrador: [#73 · Modelos web: catálogo privado y copias revisadas](https://github.com/Facu42/plan-v/pull/73), basado en #72. El cierre local del catálogo fue revalidado por reality-checker con la evidencia visual; aplicación al paciente pendiente.
