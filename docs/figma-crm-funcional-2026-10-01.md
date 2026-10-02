# Frontend de Figma y consultorio funcional

Iniciado 2026-10-01; actualizado 2026-10-02. Rama `codex/figma-crm-funcional`.
[PR #46](https://github.com/Facu42/plan-v/pull/46) integrado el 2026-10-02 a las 11:15 de Argentina,
commit `6a2d2922411a7586105e22c86000a7181be65c4e`. Publicado en [Plan V](https://plan-v-eight.vercel.app/).
Sin cambios de base, configuración de producción, generación de IA ni recursos pagos.

## Fuente y trabajo realizado

Se tomó código y captura de las doce pantallas originales de Nutrigo y sus doce versiones móviles mediante el MCP de Figma. Se tradujo ese frontend a React y CSS nativo, conectado a datos y operaciones existentes de Plan V. Esta segunda pasada amplía la adaptación anterior de estilos comunes: recupera los bloques, orden, espacios y componentes del frente de paciente.

El [inventario de 24 nodos](../design/figma-reference/manifest.json) y el [inventario de 62 SVG adicionales](../design/figma-reference/front-assets.json) conservan fuente, dimensiones y huellas. Junto a los 19 SVG iniciales hay 81 assets originales locales, sin modificar sus archivos. [Referencia y defaults](../design/figma-reference/README.md).

## Pantallas del paciente

- Inicio: indicadores, media dona, consumo/macros, tres tarjetas de actividad, dos espacios de comidas, tres ejercicios y columna diaria 325. Formularios corporales desde diálogo, sin sustituir los bloques del diseño.
- Agenda: tres indicadores, calendario y panel lateral; en celular, tarjetas blancas sobre crema, padding 16 y números 22. Confirmación y reprogramación conservadas.
- Mensajes: conversación móvil de 900 y controles existentes.
- Menú: destacado 670, imagen 298, cuatro macros y grilla 2 × 2 móvil; conserva estructura sin plan. Búsqueda, filtros, favoritos y recetas asignadas conectados.
- Receta: foto 275, cinco datos, descripción, macros, porciones e ingredientes escalables, utensilios, pasos, notas, nueve filas nutricionales y reseñas. Orden móvil original y Facts 441. Cabecera identifica el detalle.
- Plan: siete filas y espacios de comidas incluso sin un plan en el período; metas adicionales en apartado desplegable.
- Compras: resumen y estado en dos gráficos, categorías y lista. Marcar, añadir y exportar conservados. Sin precios, muestra cantidades reales rotuladas como tales.
- Diario: nueve columnas; cantidad/azúcar no disponibles quedan «—», sin exponer notas profesionales. Desplazamiento interno hasta Estado en celular.
- Progreso: área gris y conectores, cinco etiquetas, peso, dos espacios de fotos privadas, tabla y gráficos. Registrar conserva permisos y actualiza medidas. Selector 7/30/90 para medidas; calorías rotuladas siete días.
- Ejercicio: tabla con búsqueda, filtro, ordenamiento y paginación. Rutinas/feedback en detalles; sin inventar calorías ni habilitaciones.
- Recursos: portada, artículos, dos espacios de videos, autores reales, etiquetas y guardados. Detalle con cuatro botones de copiar enlace, artículos en dos columnas móviles y dos videos relacionados vacíos de 160.
- Navegación/pie: medidas originales, Plan/Compras agrupados, acceso al plan, pie después del contenido diario en celular; legales y contacto funcionales.

Los datos no soportados, reseñas y videos quedan vacíos dentro de los espacios originales. Español, marca Plan V y fotos dinámicas conservados. Descanso muestra horas/energía declaradas, sin inventar fases. Pasos, metas y calorías quemadas ausentes no se estiman. No se afirma equivalencia completa píxel por píxel: existen estas adaptaciones de datos y acciones operativas adicionales.

## Consultorio y protección de datos

Pacientes, Fichas y Planes al comienzo del menú profesional. Accesos visibles a Pacientes/Ficha/Plan y selector en todas sus pantallas. Cada fila abre ficha o plan correctos; selección conservada al navegar/recargar. Una selección inexistente o archivada presenta «Paciente no disponible», no otra ficha por defecto.

Cambiar paciente desmonta formularios/datos y aborta respuestas pendientes. Buscar desde Inicio paciente conserva el término en Plan. El detalle de recurso conserva `/crm` y selección; compartir elimina el identificador privado. El rol paciente no tiene accesos del consultorio. Menú móvil cerrado queda fuera del teclado, Escape lo cierra y devuelve el foco.

Mis registros usa diálogo nativo: foco contenido, Escape y retorno al botón. Durante un guardado, Escape/cierre no desmontan el formulario ni pierden el UUID. La prueba con petición pendiente verificó un solo envío y actualización del peso.

## Verificación y límites

- Suite completa: 213 archivos, 1.114 pruebas aprobadas y dos omitidas por configuración. Tipos y compilación aprobados; secretos y `git diff --check` limpios.
- gstack, datos ficticios locales, 1440/390: 44 recorridos base (diez paciente y doce consultorio, ambos tamaños), sin desbordamiento de documento ni iconos vacíos. Cuatro detalles adicionales de receta/recurso en ambos tamaños.
- Medidas: imagen Menú 298, grilla móvil 2 × 2, miniaturas 78, tarjetas Agenda, Diario hasta Estado, conectores Progreso, Facts con nueve filas y 441 móvil, compartir 30/iconos 18. Assets de detalle cargados sin alterar dimensiones; inventario validado por SHA-256.
- Porciones cambian/vuelven; búsqueda/orden de ejercicio probados con rutina ficticia de dos ejercicios. Formulario: modal, Escape, foco de vuelta, guardado protegido y un solo envío. Sin datos/cuentas de salud de producción.
- Primera pasada CRM: directorio → ficha → plan y recarga conservan paciente; selección inválida no abre ficha ajena; selector también en celular.
- Revisiones independientes de código y realidad: hallazgos del alcance corregidos.
- El navegador automatizado rechazó copiar al portapapeles. Se verificó el error y el enlace sin selección privada; no se afirma que se copió/publicó en redes. Los botones de redes sólo copian, no publican automáticamente.
- Antes del merge, los 16 casos de sesiones firmadas y CI quedaron aprobados para el commit ampliado del PR.

Capturas/evidencia locales en `.gstack/figma-*`; [informe sin contenido de pacientes](../design/figma-reference/browser-verification.json).

## Integración y publicación (2026-10-02)

Facundo autorizó la integración con «integralo». Se integró por PR, sin cambios directos a `main`.
Los controles del PR y los dos procesos de la rama principal terminaron aprobados:
[CI](https://github.com/Facu42/plan-v/actions/runs/37018599190) y
[sesiones firmadas](https://github.com/Facu42/plan-v/actions/runs/37018598944).

- Vercel: `dpl_97oWe74JtYEZfoHLwhT3cjYravLR`, estado `READY`, destino producción,
  alias `plan-v-eight.vercel.app` y commit del merge confirmados por el conector.
- Railway, despliegue del servicio web: `91c20409-0802-4ffe-97d0-dd9c8f135a3e`, estado `SUCCESS`.
- Railway worker: `f0b907d5-deb7-4182-9136-44eeda7bcc03`, estado `SUCCESS`.
  Ambos despliegues corresponden al mismo commit del merge.
- API pública: `/api/health` y `/api/ready` responden 200 con el SHA del merge;
  la respuesta declara modo de worker externo. Su despliegue `SUCCESS` se confirmó
  por Railway; no se probó aquí la ejecución de trabajos.
- Navegador gstack: ingreso público con respuesta 200, contenido visible, sin errores de
  consola y carga de 1,29 segundos. Este control de publicación no reemplaza los recorridos
  locales de paciente/consultorio ni afirma una nueva prueba completa con cuentas reales.

No se aplicaron migraciones, no se cambiaron ajustes de producción ni se contrataron recursos.
El detector de secretos confundió el UUID de un despliegue de Railway con una clave por el
rótulo «API». Se corrigió el rótulo y se exceptuó únicamente la huella histórica de esa
línea, commit y regla en `.gitleaksignore`; ningún secreto ni archivo completo queda permitido.
