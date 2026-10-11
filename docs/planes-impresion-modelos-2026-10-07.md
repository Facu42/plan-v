# Planes: impresión y relevamiento de Modelos

Trabajo de escritorio en `codex/nutri-plan-semanal`, continuación de [Planes](planes-semanal-web-2026-10-07.md). Academy y mobile excluidos. Se usa ECC como guía de componentes, pruebas y carga diferida, respetando las reglas del proyecto.

## Contraste previo con Nutriboost

Video [Nutriboost en Loom](https://www.loom.com/share/35b428b996314f9c8f5505de4a6297cb), revisado mediante `/browse`. Facundo reemplazó la escucha pendiente por las funciones observables en pantalla.

- **126,122 segundos, 2:06:** el editor tiene «Exportar PDF» y «Notificar cliente». [Captura](evidencia-planes/nutriboost-exportar-pdf-0206.png). No se ve el contenido del PDF ni la descarga, personalización o envío; no se atribuyen esos recorridos al video.
- **431,087 segundos, 7:11:** Modelos presenta «Planes modelo (3)», «Recomendaciones (1)» y «Alimentos a evitar (1)», buscar y crear modelo. Las tarjetas distinguen borrador/publicado; un borrador permite publicar y tiene «Aplicar a cliente» deshabilitado; las publicadas muestran esa acción habilitada, editar y eliminar. [Captura](evidencia-planes/nutriboost-modelos-0711.png). No se observa una aplicación efectiva ni su cálculo de cantidades.

El plan original prioriza PDF como P1 y Modelos como P2. Se implementa primero la salida imprimible del plan existente; Modelos requiere un catálogo propio con persistencia, publicación y aplicación revisada a pacientes.

## Implementado: imprimir o guardar como PDF

Desde Planes y Ficha → Plan alimentario, «Imprimir / guardar PDF» abre una ventana de revisión. Se elige borrador guardado o copia publicada y se puede agregar el nombre del profesional sólo para ese documento. No cambia el perfil, no publica, no notifica ni asigna contenido. El documento usa la identidad de Plan V.

La copia se consulta nuevamente al servidor y se congela junto con el nombre del paciente. El borrador sólo está habilitado cuando coincide con el formulario revisado y la revisión guardada; si hay cambios sin guardar, se puede imprimir únicamente una copia publicada existente. Sin plan guardado o publicado, la acción permanece deshabilitada y explica que hay que guardar. Un cambio de paciente/desmontaje invalida la respuesta pendiente y elimina la vista anterior.

El documento contiene nombre, período, versión y estado explícito, fechas y momentos, alimentos con cantidad/medida y gramos equivalentes declarados, fuente/revisión del alimento, recetas históricas con ingredientes ajustados a las porciones, pasos y notas públicas. Conserva clasificación de nutrientes y procedencia de IA incluso con composición incompleta. Los días sin indicaciones se muestran como tales. No inventa nutrientes, no imprime antecedentes privados, objetivos clínicos ni identificadores internos. Los textos se escapan antes de incorporarlos al documento. La demo se identifica con datos ficticios.

La vista previa espera su carga antes de habilitar impresión. La vista usa un documento aislado mediante Shadow DOM: la seguridad vigente impide marcos embebidos y se conserva sin cambios. Al imprimir abre una ventana desde el clic, desvincula su acceso a la ventana original, espera la carga y la cierra al terminar/cancelar la impresión. Si el navegador bloquea la ventana, explica cómo habilitarla y permite reintentar. La generación del documento se carga sólo al abrirla. La impresión usa el navegador: allí se elige «Guardar como PDF». Se diseñó para A4; recetas/comidas cortas se mantienen juntas, y las extensas pueden continuar en la página siguiente. [Vista 1440](evidencia-planes/plan-v-impresion-1440.png), [vista 1280](evidencia-planes/plan-v-impresion-1280.png), [PDF de prueba ficticio](evidencia-planes/plan-v-impresion-demo.pdf).

## Verificación

- Suite completa con dos trabajadores: **270 archivos, 1513 pruebas aprobadas y 2 omitidas**. El primer intento simultáneo con compilación agotó memoria local; la repetición completa pasó. Tras conservar la precisión de cantidades muy pequeñas, 11 pruebas dirigidas de dos archivos pasaron; tipos y compilación pasaron ejecutados después. Se conservan avisos existentes de Zod/tamaño del paquete principal; documento de impresión en paquete separado.
- Pruebas del documento: medidas históricas, receta ajustada, notas, escape de texto, procedencia IA incompleta, identificación publicada y días de períodos largos. La ventana restringe borrador no coincidente y espera carga. Las cantidades indicadas conservan su precisión y los valores positivos pequeños no se imprimen como cero.
- Navegador demo: pasar alimento de 40 a 41 g sin guardar deshabilita impresión de borrador; devolverlo a 40 la habilita, sin guardar ni publicar. Cambiar el nombre del profesional actualiza sólo la vista. Logo local cargado. Botón observado invocando la impresión en una ventana real, con paciente/cantidades/logo correctos y acceso a la ventana original desvinculado. Prueba con política de seguridad que bloquea marcos: vista lista sin iframe. Bloqueo de ventana emergente y reintento comprobados.
- En Ficha se retuvo la consulta de impresión de Sofía y se intentó cambiar a Marina: la navegación quedó bloqueada mientras se preparaba; la vista abrió el plan de Sofía con su nombre. Cerrar y cambiar a Marina elimina la vista anterior. Los nombres también quedan congelados y las respuestas tardías se descartan como defensa adicional revisada en código.
- PDF generado con Chrome desde el mismo HTML de la vista previa, inspeccionado visualmente en sus dos páginas y por extracción de texto: 40 g de alimento, 20 g de ingrediente ajustado, siete fechas y receta completa en la segunda página. No se automatizó la ventana nativa de Windows ni una impresión física.
- Escritorio 1440×1000 y 1280×800: acciones visibles, sin desborde horizontal de página o ventana; vista previa desplazable. Revisiones de código y realidad corrigieron aislamiento del paciente y procedencia IA antes del cierre.

## Plan de acción restante

1. **Modelos/Plantillas:** catálogo privado del profesional con las tres categorías observadas; crear desde contenido revisado, buscar, editar, publicar y aplicar a un paciente como borrador revisable. Conservar referencias históricas y definir explícitamente cantidades; no atribuir escalado automático al relevamiento. Contrastar nuevamente el recorrido antes de desarrollarlo y mostrar cualquier decisión de uso incómoda.
2. **Exportación ampliada:** personalización persistente de identidad/logo, tablas opcionales de nutrientes y descarga directa de un archivo, si se incorpora ese recorrido. La salida actual es guardar PDF mediante impresión del navegador.
3. **Notificación:** revisar el flujo de entrega por separado; imprimir no envía un aviso al paciente.
4. **Planes:** seguir con pendientes documentados, incluyendo reemplazar/combinar días sólo después de definir el recorrido.

Este incremento no cierra todo Planes ni todo el dashboard. No agrega migraciones, llamadas de IA ni servicios pagos. Las migraciones anteriores del PR siguen preparadas y probadas localmente, sin aplicar en producción. No se publicó ni fusionó el PR.
