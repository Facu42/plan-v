# Recetas del dashboard web — contraste y acción

## Alcance y regla de trabajo

Facundo pidió continuar Recetas y contrastar **siempre con Nutriboost antes de desarrollar**, incluyendo los apartados con IA. Escritorio web; mobile para otra etapa; Academy excluida. ECC sigue como guía de investigación, pruebas y revisión (`ef648e0`), sin instalar hooks globales.

Cada incremento registra comportamiento visto, afirmaciones sin demostración, API existente, faltante, decisión de diseño y verificación. No modificar producción ni contratar servicios. Rama `codex/nutri-recetas`, basada en `codex/nutri-alimentos` (PR #70 todavía en borrador).

## Contraste realizado antes de los cambios

Fuente: [demo de Nutriboost](https://www.loom.com/share/35b428b996314f9c8f5505de4a6297cb), pantallas del tramo 6:12–6:46. Capturas renovadas aproximadamente a 6:25 (catálogo) y 6:40 (detalle); se revisaron los subtítulos visibles. No se afirma escucha directa del audio completo. Facundo reemplazó el requisito de escucha por el relevamiento de lo visible en pantalla; el audio no es un pendiente.

| Función | Nutriboost observado | Plan V comprobado | Acción |
|---|---|---|---|
| Catálogo | Tarjetas, origen/recetario, categorías, favoritos y macros por 100 g | Biblioteca con recetas propias versionadas y tarjetas por porción | Completar catálogo general, filtros, detalle y favoritos sin confundir bases de cálculo |
| Detalle | Ingredientes en gramos, pasos, preparación/cocción, porciones y peso final | Editor con alimentos, medidas, preparación/cocción, pasos, rinde y peso final persistidos | Completar vista propia de detalle del catálogo |
| Análisis | Por porción; selección SARA 2 / ArgenFoods / USDA; macros y micros | Composición de 11 nutrientes vinculada al catálogo propio; valores por porción, receta y 100 g finales | No ofrecer bases externas sin datos autorizados ni porcentajes diarios sin referencia definida |
| Creación con IA | **No demostrada en este tramo**; no atribuirle ese flujo por suponerlo | API `/api/ai/jobs` con `recipe_draft`, consulta, aplicación de borrador y revisión; proveedor gratuito existente | Reutilizar API; conservar consentimiento, alergias, aislamiento y etiqueta de estimación |
| Publicación | El detalle no demuestra el proceso completo | Publicación y asignación separadas; copia publicada inmutable | Conservar circuito; una generación nunca publica ni asigna automáticamente |

La página `/crm/recetas` actualmente se resuelve a Biblioteca. Esto se comprobó en el navegador; no afirmar que ya existe acceso propio en el menú lateral. La navegación definitiva permanece en el plan general.

## Decisión de experiencia de uso

Se mostró el formulario existente debajo del catálogo vacío: empujaba las acciones hacia abajo. Facundo eligió **ventana de creación y edición, como Alimentos**. El catálogo queda general; el paciente se elige dentro de la generación personalizada con IA o de la asignación. Recursos conserva su contexto de paciente.

## Incrementos

1. **Verificado:** ventana nativa de creación/edición; paciente contextual; reutilización de API de IA; estados de espera; consultar la misma propuesta; abrirla en el editor; advertencias y estimaciones visibles; protección de cambios sin guardar.
2. **Verificado localmente:** vínculo de ingredientes con Alimentos; medidas caseras; cálculo reproducible de 11 nutrientes por porción, receta completa y por peso final; fuentes/versiones guardadas; desconocidos como desconocidos; preparación, cocción y peso final. Migración preparada y probada en PostgreSQL local; sin aplicar en producción.
3. **En revisión:** búsqueda por título/ingrediente, filtros por momento/estado/favoritos, favoritos profesionales privados y detalle del catálogo con versiones separadas. Funcionalidad local implementada; compactación de encabezados autorizada y aplicada. Categorías culinarias y vínculo completo con el editor del plan siguen pendientes.

## Contrato del primer incremento

`recipe-ai-flow.ts` consulta una propuesta existente mientras esté en cola o ejecución. Si termina con un resultado válido, el cliente aplica únicamente el borrador y confirma su lectura antes de abrirlo. Agotar la espera ofrece «Consultar propuesta», sin pedir otra generación. Fallos, cancelación o contexto vencido impiden usar la propuesta. Salir de la vista detiene las consultas locales. El estado de espera es temporal en esta vista; recuperar propuestas tras recargar sigue pendiente.

`RecipeCatalog.tsx` conserva borradores, publicación, asignación, permisos y fuentes existentes. La generación se inicia desde una ventana donde se eligen paciente y descripción. La API sigue exigiendo consentimiento y alergias/restricciones; no se conceden permisos automáticamente. El segundo incremento suma análisis de composición; no cambia el proveedor ni dispara generaciones automáticamente.

`ProfessionalLibrary.tsx` proporciona los pacientes disponibles. Elegir el contexto dentro de la ventana no cambia el paciente global ni desmonta el formulario. `NutrigoShowroom.tsx` omite la barra de paciente solo en el catálogo de Recetas, conservándola en Recursos. El consumidor anterior `ShowroomHealthyMenu.tsx` mantiene avisos compartidos y consulta de pendientes.

## Verificación

Resultados finales y capturas se registran al terminar. La prueba inicial del contrato de espera falló porque faltaba el módulo; después pasaron los casos de cola, resultado, fallo, contexto vencido, espera agotada y aborto. La demo local tiene IA deshabilitada: las comprobaciones de contratos con resultados ficticios no acreditan una nueva llamada al proveedor real.

Primer incremento verificado: 258 archivos y 1466 pruebas aprobadas; 2 omitidas. Tipos y compilación aprobados. Navegador: ventana nativa, foco contenido, Escape/retorno al botón, borrador protegido, cambio local de paciente sin perder descripción, guardado y recarga de receta ficticia de 2 porciones/190 kcal declaradas. A 1440×1000 y 1280×800 no hay desborde horizontal; cabecera y acciones visibles. Recursos conserva su selector global. Revisión de código aprobada y revisión de realidad realizada. Capturas finales en evidencia-recetas/. IA local deshabilitada; no se afirma nueva generación con proveedor real.

Web pública renovada: https://nutriboost.ar/ anuncia cálculos, importación de mediciones y asistente con IA; no convierte en demostrada una generación de recetas que el video no muestra.

Segundo incremento: `recipe-catalog-nutrition.ts` convierte medidas del alimento en gramos y calcula 11 nutrientes por receta, por porción y por 100 g cuando existe peso final informado. Un ingrediente sin composición deja el nutriente desconocido; cero conserva su significado. Conserva una copia de la revisión usada, permite actualizarla explícitamente y rechaza duplicados, medidas inexistentes y cantidades inválidas.

El cliente solo envía identificador, revisión y medida del alimento. El servidor demo y el RPC persistente resuelven alimentos autorizados y recalculan; no aceptan composición ni snapshots del cliente. La versión anterior se obtiene del almacenamiento. La etiqueta IA sigue presente al completar, quitar o volver a vincular ingredientes; un análisis incompleto elimina cifras anteriores sin borrar la procedencia. Cambiar rinde o alimentos crea una nueva revisión cuando la anterior está publicada. Los valores publicados permanecen congelados.

Verificación final del segundo incremento: **260 archivos aprobados; 1476 pruebas aprobadas y 2 omitidas**. Tipos, compilación y revisión de migraciones aprobados. La primera corrida sin limitar concurrencia sufrió dos cierres de procesos; se repitió toda la suite con cuatro procesos y pasó. Advertencias de compilación preexistentes de Zod/tamaño de paquete. Pruebas PostgreSQL locales verifican aislamiento A/B, referencias vencidas, medidas inválidas, conservación de valores publicados, origen IA y escritura directa rechazada. Revisión de código aprobada tras corregir el aviso IA al reabrir composición incompleta.

Navegador demo: guardado y recarga de receta ficticia con 2 cucharadas de 10 g, 2 porciones, peso final 40 g, preparación 10 min y cocción 0 min. Resultado confirmado: 38 kcal por porción; 190 kcal por 100 g preparados. Ingrediente sin composición produce «Sin dato»; quitar peso final impide calcular por 100 g. A 1440×1000 y 1280×800 no hay desborde horizontal; acciones permanecen visibles. Sin errores de consola. Capturas: [1440](evidencia-recetas/plan-v-composicion-1440.png) y [1280](evidencia-recetas/plan-v-composicion-1280.png).

Límites: sin importar SARA 2/ArgenFoods/USDA; sin porcentajes de ingesta diaria; sin nueva llamada al proveedor IA real; sin migración de producción ni desarrollo móvil. La receta ficticia del navegador quedó como borrador privado, sin asignarse a pacientes.

## Tercer incremento: contraste renovado antes de desarrollar

Revisión visual renovada del video: [catálogo 6:16](evidencia-recetas/nutriboost-revision-0616.png), [categorías y composición 6:22](evidencia-recetas/nutriboost-revision-0622.png) y [detalle 6:38](evidencia-recetas/nutriboost-revision-0638.png). Tiempos comprobados en el reproductor. Se revisaron pantallas y subtítulos disponibles; no equivale a escucha directa exhaustiva del audio. Fuente: [demo de Nutriboost](https://www.loom.com/share/35b428b996314f9c8f5505de4a6297cb).

- Observado: grilla de tarjetas, origen «Plataforma»/recetario, categorías culinarias, corazón, contador y macros explícitos por 100 g. No se demuestra el filtro completo ni la persistencia del favorito al recargar.
- Observado: detalle con ingredientes/cantidades, pasos, preparación/cocción, rinde, peso final, selección de base y análisis por porción. El segmento no demuestra creación de recetas mediante IA.
- Adaptación propia: búsqueda por título e ingrediente sin depender de mayúsculas/acentos; momento, estado («Con borrador» y «Con versión publicada») y favoritos combinables. Ambos estados pueden coincidir cuando hay copia publicada y un borrador posterior. Las categorías culinarias no se confunden con momentos del día y quedan pendientes.
- Tarjetas de Plan V: origen «Consultorio», estado, favorito, consulta y edición. Macros por 100 g preparados cuando existe peso final; de lo contrario, por porción. La base se indica explícitamente. Publicación, asignación y fotos están en el detalle para reducir acciones por tarjeta.
- Detalle: «Volver al catálogo» conserva búsqueda y filtros y devuelve el foco a la receta. El título recibe foco al abrir. Un selector separa borrador actual y copia publicada, sin mezclar ingredientes o nutrientes de distintas versiones. Crear nueva versión, publicar y asignar actúan según el circuito existente.
- Favoritos profesionales: API propia con booleano explícito e idempotencia; separados de los del paciente. Demo y SQL comprueban propietario; RPC/RLS rechazan nutricionista ajeno y paciente. Error visible con reintento, sin confirmar un cambio fallido. La copia local anterior de demo se amplía sin perder recetas; regresión de reapertura incluida.

Pruebas de navegador del incremento: búsqueda «aVÉná» encuentra Avena; favorito conservado tras recarga; filtro y búsqueda conservados al volver del detalle; foco devuelto al botón; mensaje de cero resultados; detalle sin desborde horizontal a 1440/1280. Evidencia: [detalle 1440](evidencia-recetas/plan-v-detalle-tercero-1440.png) y [detalle 1280](evidencia-recetas/plan-v-detalle-tercero-1280.png). La demo encontrada durante esta revisión ya tenía una receta ficticia publicada; este incremento no la publicó ni la asignó.

**Pausa de experiencia de uso:** [el catálogo actual](evidencia-recetas/plan-v-catalogo-tercero-1440-antes.png) repite encabezados de Biblioteca y desplaza nutrientes/acciones bajo el primer pliegue. Se mostró a Facundo y se propuso un solo encabezado de Recetas, explicación breve y filtros/tarjetas más arriba. Facundo indicó continuar; se aplicó la compactación descrita en el cierre de este documento.

Verificación final del tercer incremento: **262 archivos aprobados; 1481 pruebas aprobadas y 2 omitidas**. Tipos, compilación y validación de migraciones aprobados. PostgreSQL local verifica favoritos privados, idempotencia, aislamiento entre profesionales y rechazo de pacientes/escrituras directas. Revisión de código aprobada y revisión de realidad realizada sin nuevos bloqueos funcionales; el diseño permanece abierto. La compactación fue autorizada en el mensaje posterior y aplicada. Migraciones sin aplicar en producción.

## Cierre de la compactación autorizada

Facundo indicó: «la escucha pendiente reemplázala con lo q muestra en pantalla. continúa». Desde este punto la referencia es lo observado visualmente; no se exige audio ni se afirma haberlo escuchado. Lo anunciado sin flujo visible sigue separado de lo demostrado.

Un único título visible de Recetas, pestañas preservadas y explicación breve. Avisos de publicación/estimaciones en una sección desplegable al pie; accesibles por teclado y sin eliminar el contenido. Tarjetas profesionales con espacios ajustados y placeholders más cortos; fotografías reales mantienen 150 px. Recursos y tarjetas de paciente no reciben estas reglas.

Navegador: sin desborde horizontal a 1280×800 y 1440×1000. En las dos recetas ficticias sin foto del ensayo, «Ver receta» termina en 799,8 px con el aviso de instalación visible; títulos más largos, fotos y distintos datos pueden requerir desplazamiento. No se promete una altura fija para todas las recetas. [1280](evidencia-recetas/plan-v-catalogo-compacto-1280.png) · [1440](evidencia-recetas/plan-v-catalogo-compacto-1440.png). Revisión de código aprobada.
Verificación del ajuste visual: tipos y compilación aprobados; 8 pruebas de catálogo/detalle aprobadas en 2 archivos. Suite general del incremento anterior: 1481 aprobadas, 2 omitidas; no se atribuye esa corrida al ajuste visual posterior. Las advertencias de compilación de Zod/tamaño de paquete permanecen. Categorías culinarias e integración con editor del plan siguen pendientes.
Revisión de realidad de la compactación aprobada; no representa cierre de todos los pendientes de Recetas ni publicación.
