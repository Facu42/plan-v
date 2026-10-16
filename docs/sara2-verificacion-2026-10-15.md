# SARA 2: catálogo argentino y verificación

Se incorpora la tabla exacta indicada por Facundo: SARA 2, Ministerio de Salud, edición 2022. El [PDF del Ministerio](https://iah.msal.gov.ar/doc/720.pdf) y la [copia de CONICET](https://ri.conicet.gov.ar/bitstream/handle/11336/258411/CONICET_Digital_Nro.b797bd4f-2e57-4853-8ea6-a1d8caef11e6_B.pdf?sequence=2&isAllowed=y) tienen 142 páginas, 1.603.485 bytes y SHA256 `14706a46e0262e2223b0c44d4c77c31090e3554cf63602fe58ab765f32b81c7f`.

**Estado vigente, 16/10/2026:** entrega 8 aislada en `codex/nutridesk-release-sara2`, integrada mediante avance directo sobre la entrega 7 final `5c8ea5441d466c54be20899b14b8cf0758cbcce4` ([PR #127](https://github.com/Facu42/plan-v/pull/127)). Se conservan `main` hasta `9c56854`, los cambios de correo y guardas de WhatsApp de la entrega 7, demo estricto, OCR/CSP y el control del ritmo del ensayo. El único conflicto de recuperación fue documental y se conservaron ambas entradas. El stash de recuperación y su respaldo permanecen guardados. Esta integración no publica el producto ni aplica SQL.

ROOT comprobó el 16/10, con la herramienta oficial de comprobaciones de PR, que todos los controles de #127 en `5c8ea54` están aprobados: verify, e2e, sesiones firmadas, secretos y vista previa. Ese resultado pertenece al padre 7; el CI de la entrega 8 se comprobará sobre su propia cabeza.

## Contenido y uso

- 930 registros: 906 alimentos y 24 suplementos, distribuidos en 26 grupos. Cada registro conserva 39 componentes, el texto numérico original, unidades, color y procedencia por celda, preparación y referencia de página, tabla y fila.
- La extracción con pdfplumber y la comprobación con PyMuPDF coinciden en las 36.251 celdas presentes. La representación compacta conserva sin discrepancias las 36.270 posiciones, incluidas las 19 celdas de una fila complementaria ausente.
- Los 15 suplementos rotulados en gramos usan base de 100 g y los nueve rotulados en mililitros usan 100 ml. Una cantidad de volumen no se convierte en peso; las recetas y los grupos con volumen conservan peso desconocido. Para composición por 100 g de una receta se necesita su peso final medido.
- Se conservan 335 celdas vacías y los 19 micronutrientes ausentes de salmón blanco crudo. No se completan con salmón rosado. Los 47 valores positivos con color de cero asumido conservan su número y una advertencia. Los 18 colores sin procedencia identificada siguen señalados.
- Las 909 discrepancias entre B12 impresa en mg y su definición en µg conservan ambas unidades y bloquean su cálculo automático. Los encabezados discordantes de las páginas 75 y 105 se mantienen como incidencias revisables.
- Los identificadores son UUIDv5 derivados del SHA del PDF, página, tabla y fila: no son códigos oficiales. El propio archivo conserva la receta de derivación y los diccionarios necesarios para interpretar cada posición.

El archivo compacto de 1.045.847 bytes queda sólo en el servidor, con SHA256 `bf0a12654c68cc97827afb5c2e90c58b97b233d9f1b4e9e35296c67cc28f0634`. El navegador recibe resultados paginados y hasta diez componentes por página en el detalle. Se cargan inicialmente SARA 2 en el catálogo y los selectores; las fuentes propias y externas conservan una elección explícita. No se distribuye el PDF ni se presume una licencia comercial que el documento no declara.

Las referencias institucionales son de sólo lectura. El servidor y la base rechazan que una carga propia falsifique su procedencia. Las recetas, los componentes del plan y los grupos guardan su copia de composición. Cambiar un borrador o publicar otra versión de receta no modifica el plan ya publicado.

Las recetas propuestas por IA sólo incorporan cifras a partir de una coincidencia exacta y única de nombre, preparación y unidad nativa de SARA 2. Una propuesta sin referencia segura conserva sus cifras ausentes y un aviso de revisión. Las propuestas de menú sin contrato de referencias no agregan cifras inventadas; se puede seleccionar una receta publicada y revisada. Los históricos y su procedencia de IA se conservan.

Carbohidratos disponibles y totales declarados no se suman ni promedian como si fueran una misma definición. El control cubre recetas, alimentos, días y semanas. El resumen del servidor conserva la definición de la versión publicada por identificación y versión, también cuando combina una receta y un alimento. La definición local integra la identidad del trabajo de IA y se excluye de su pedido al proveedor; no se admiten campos nuevos de procedencia en los pedidos HTTP.

## Evidencia propia

### Cierre definitivo después del catálogo cargado, 16/10

- Suite completa propia final: **2.999 aprobadas, cero fallos, dos omitidas, 458 archivos**, entre **09:07:56 y 09:11:31 ART**, con dos trabajadores. JSON `planv-sara2-full-catalog-final-20261016.json`. Una invocación inicial sin límite de trabajadores se canceló por precaución de infraestructura antes de obtener resultados; no se atribuyeron fallos al producto. No se volvió a ejecutar la extracción ni las pruebas SQL independientes, cuyos archivos no cambiaron.
- Congelación final de **1.787 rutas**, huella `2e5bd04d3f747d1e4bf4f2c436ee1518fbb9e4768bbdf8f7d599235f3476714e`, comprobada sin cambios después de la suite y QA. Tipos web/servidor/e2e aprobados; compilación final **7,80 segundos**. Migraciones y manifiesto **18 pendientes + tres bases exactas = 21** aprobados; vistas públicas y SQL permanecen intactos respecto de su comprobación previa.
- Secretos: límites del repositorio y scanner final de **48,93 MB sin hallazgos**, posterior al CSS definitivo. Historial anterior al commit propio: 578 commits/80,59 MB y objetos grandes 54,94 MB sin hallazgos, con controles ficticios positivos y negativos. Los dos archivos grandes locales de referencia Figma, excluidos del scanner de fuente, no forman parte del cambio.
- QA independiente descubrió un tercer recorte real: el catálogo cargado medía 687 px dentro de 358 px, afectando encabezado, estadísticas y filtros. Se limitó su cuadrícula al ancho disponible y se conservó el desplazamiento interno de la tabla. Un ajuste del primer panel de filtros móvil evita que abra a la izquierda de la vista. GREEN: catálogo/encabezado/estadísticas de **358 px**, panel de filtros entre **16 y 236 px**, controles entre **35 y 217 px**. En escritorio, catálogo de **1.000 px** entre 332 y 1332 sobre una vista de 1440 px. Paginación, filtro y detalle comprobados; detalle sin desborde a **340/340 móvil y 648/648 escritorio**.
- Los tres P2 de presentación y el anclaje menor quedan cerrados. [Revisión independiente de código](sara2-revision-independiente-2026-10-15.md) aprobada sin P1/P2; [QA independiente](sara2-qa-2026-10-16.md) incluye captura de error/recuperación, vacío, catálogo, unidades, versiones y compras. El CI de esta cabeza sigue siendo una comprobación posterior a la publicación del borrador. Ninguno de estos resultados autoriza producción.
- Se conservan dos observaciones P3 de redacción, detalladas en QA: la búsqueda sin coincidencias utiliza un texto de catálogo no cargado y el aviso de error expone HTTP 500. No quedan P1/P2 abiertos; no se declara ausencia total de observaciones.

### Checkpoint posterior al editor y anterior al catálogo cargado — histórico

- Suite completa propia de ese checkpoint: **2.999 aprobadas, cero fallos, dos omitidas, 458 archivos**, entre 01:48:21 y 01:51:58 ART. JSON `planv-sara2-full-after-ui-20261016.json`. No se repitió al retomar la sesión; la suite definitiva posterior al catálogo figura arriba.
- Los tipos web, servidor y e2e aprobaron; la compilación posterior al ajuste aprobó en 7,63 segundos. Las comprobaciones de migraciones y manifiesto siguen aprobadas, con SQL intacto.
- Inventario de ese checkpoint: **1.787 rutas**, huella `ff605f0535407dfa801d9af5318ae1a32763ae11053e34ee6905e6c34aa2f9fa`. Su comparación posterior a la suite conservaba todos los archivos; el CSS de catálogo cambió después y tiene una nueva huella arriba.
- La prueba visual detectó un desborde heredado del editor profesional a 390 px: sus controles alcanzaban unos 930 px aunque la página declaraba 390 por recorte. Se acotaron los cambios a contenedores profesionales con editor y al tamaño móvil: una columna, mínimos de cuadrícula de cero, análisis debajo del formulario y componentes adaptables. Las 25 escenas Nutrigo y la vista de escritorio permanecen conservadas.
- También se corrigieron tres etiquetas que trataban los mililitros del snapshot como gramos: copia profesional publicada, diálogo de copiar día y edición de cantidades de un modelo. El render real de copia y formulario de modelo dio **dos fallos previstos y un control aprobado** antes de corregir; el focal posterior aprobó **19 casos en cuatro archivos**. Conserva gramos y medidas declaradas de los históricos, sin simulaciones de hooks.
- GREEN real a 390 px: contenedores del editor de 358 px, formulario dentro de la vista y distribución de una columna de 332 px; los controles quedan dentro y los días usan su carrusel interno. Copia publicada y copiar día muestran 50 ml. El recorrido posterior descubrió y corrigió el catálogo cargado, documentado en el cierre definitivo.

### Checkpoint integrado anterior al último ajuste visual, 16/10 — histórico

- Focal propio integrado: **113 aprobadas, cero fallos, 21 archivos**. Se cuentan archivos de resultados, no las agrupaciones internas de Vitest. JSON `planv-sara2-integrated-focal-20261015.json`; ejecutado el 15/10 a las 21:00 ART sobre esta combinación sin cambios posteriores de aplicación.
- Tipos web, servidor y e2e aprobados; compilación aprobada en 9,42 segundos. Se conserva el aviso heredado de paquetes grandes.
- Manifiesto: **18 migraciones pendientes + tres bases exactas = 21 archivos**. RED real: el verificador detectó SARA 2 como archivo extra antes de registrarlo. Se conserva `20261014180000_sara2_catalog.sql`; no se renombró ni se alteraron las tres bases aplicadas. Su hash vigente bajo el esquema canónico UTF-8/LF es `074ed4703b754e5e0d3a1696321cb1109c6ba256e430c002f515a25bfcbd4036`, igual al manifiesto. El hash de bytes actual con saltos del checkout Windows es `38c385ca155d108abbf6b337998d8d32cb165fa505dec0f3778d1df89acb0a64`.
- Migraciones, vistas públicas y límites de secretos aprobados localmente el 16/10.
- Scanner actual: 48,91 MB de código y documentos, 578 commits y 80,59 MB de historial, más 54,94 MB de objetos grandes comprobados con solapamiento; sin hallazgos. Controles ficticios positivo y negativo aprobados.
- Suite completa propia anterior al último ajuste visual: **2.996 aprobadas, cero fallos, dos omitidas, 457 archivos**, entre 01:36:45 y 01:40:53 ART del 16/10. JSON `planv-sara2-full-integrated-20261016.json`. Incluye la base 7, los avances de main y SARA 2; es histórica y no sustituye la suite definitiva de 2.999.
- Congelación previa a la suite: 1.786 rutas de aplicación, scripts, tipos, pruebas y migraciones, con huellas guardadas en `planv-sara2-runtime-freeze-20261016.json`. La comprobación posterior a la suite conserva exactamente las 1.786 huellas, sin cambios.
- Revisión independiente de la combinación integrada: **80 pruebas aprobadas en 14 archivos y 16 comprobaciones SQL adicionales con las 98 migraciones**, sin P1/P2 abiertos. La RPC renombrada no permite falsificar fuente ni metadatos; el wrapper de compras conserva VOLATILE, vigencia, autorización y mililitros. Son resultados del revisor, separados de la suite propia.
- El ensayo visual posterior descubrió los faltantes de presentación descritos arriba. Estas cuentas quedan como históricas, sin atribuirlas al candidato corregido.

### Evidencia histórica previa a la integración

Los archivos de salida se guardaron en `%TEMP%`, con prefijo `planv-sara2-`, y corresponden al estado indicado:

| Comprobación | Resultado |
|---|---|
| Focal previa, 14/10 | 41 aprobadas, cero fallos, 13 archivos |
| Suite completa inicial, 15/10 | 2.693 aprobadas, cero fallos, dos omitidas, 411 archivos |
| Suite después del ajuste visual, antes de las correcciones de definición | 2.693 aprobadas, cero fallos, dos omitidas, 411 archivos |
| Reproducción de definiciones, antes de corregir | Cinco fallos previstos y seis aprobadas en tres archivos |
| Focal después de corregir definiciones | 54 aprobadas, cero fallos, diez archivos |
| Tipos, migraciones y vistas públicas | Aprobados localmente |
| Compilación después de las correcciones de definición | Aprobada, 12,16 segundos; aviso heredado de tamaño de algunos paquetes |
| Generación original del SQL, antes de la normalización de Git | Repetida sin cambiar sus bytes; hash raw histórico `32472e9dc3de5adcf86d923d0f2a54ebc7206d9e513509b50cd923e51ee9f1ce`, conservado en el respaldo. La identidad canónica vigente figura en la sección integrada |
| Scanner de código final | 47,58 MB, sin hallazgos; controles ficticios positivo y negativo aprobados |
| Scanner de historial | 571 commits, 78,60 MB, sin hallazgos |
| Objetos grandes del historial | 54,94 MB con solapamiento de fragmentos, sin hallazgos |

La [revisión independiente](sara2-revision-independiente-2026-10-15.md) encontró y reprodujo la pérdida de definición en el resumen del servidor, y después verificó la reparación con 54 pruebas propias en diez archivos. También comparó los 930 registros del SQL con el catálogo y sus bases: todos coinciden, nueve son ml y ningún ausente se convierte en cero. No dejó hallazgos P1/P2 abiertos en el alcance revisado. Es evidencia independiente, no se suma a la cuenta de la suite propia.

Las suites anteriores se conservan como evidencia histórica, sin atribuirlas a la combinación integrada de las ocho entregas.

## Comprobación visual local inicial (15/10; antes de integrar la entrega 7)

Se usó `/browse` de gstack contra la aplicación demo aislada, sin credenciales ni llamadas a proveedores, en 1440×1000 y 390×844. Se verificaron búsqueda, suplementos, selección, cuatro páginas de componentes, texto de B12, referencia original desplegable y cálculo de 50 ml de Ensure Plus en 70,5 kcal.

El primer ensayo detectó desborde horizontal en el nuevo detalle: ancho útil/desplazable de 648/855 en escritorio y 340/601 en móvil. Se corrigió exclusivamente la distribución de la composición original y su texto largo, con clases locales. La repetición dio 648/648 y 340/340, incluso con la referencia SHA desplegada. La página conservó 1440 y 390 de ancho; no hubo errores de consola. Las 25 escenas originales de Nutrigo permanecen sin cambios. No se declara un porcentaje de fidelidad ni una comprobación de tablet.

Capturas locales de evidencia: `%TEMP%/planv-sara2-overflow-red-390-20261015.png`, `planv-sara2-b12-green-{390,1440}-20261015.png` y `planv-sara2-50ml-green-{390,1440}-20261015.png`.

## Regression Guard: paso 10

- **Flujos críticos:** catálogo → receta → plan → publicación → compras, con pruebas API y SQL local; grupos, paginación, dos consultorios y denegación a paciente, cubiertos. Receta publicada antigua conservada al publicar otra versión, comprobada por API.
- **Regresiones:** volumen tratado como masa, faltantes convertidos a cero, metadatos institucionales falsificados, sobrescritura al repetir el seed, carbohidratos mezclados en receta/día/semana y pérdida de definición en resúmenes del servidor, cubiertos. Etiquetas de unidad en la copia profesional y editor real de modelos cubiertas por render. El recorte móvil se reprodujo y se volvió a medir sobre código real. Ajuste de porciones y errores de proveedor conservados.
- **Contratos:** datos institucionales sólo de salida, pedidos estrictos sin procedencia forjada, copias versionadas, unidades nativas y definición local sin exposición al proveedor.
- **Áreas frágiles:** composición con unidades impresas ambiguas, mezcla de fuentes, generación de recetas y publicación. Las discrepancias se preservan y el cálculo no completa cifras ausentes.
- **Migración:** aditiva; verifica 930 filas, impide colisiones antes de sobrescribir y tolera repetir el bloque de carga sin cambios. Reemplaza funciones conservando permisos y comprueba aislamiento en base temporal. Retirada operativa: volver al cliente anterior conservando catálogo y copias; no eliminar alimentos referenciados. SQL sin aplicar a producción.
- **Fire test:** cambiar temporalmente la unidad de todos los suplementos a gramos produjo dos fallos previstos y tres aprobadas; restaurar los bytes originales dejó cinco aprobadas y cero fallos. Sin datos reales ni cambios persistentes de esa mutación.
- **Automatización:** checksum del archivo institucional, verificación de forma e identificadores únicos y generador reproducible del SQL. Manifiesto ampliado a 18 pendientes y tres bases exactas, sin excepciones por rango ni aplicación remota. La checklist de publicación obliga a medir límites de encabezado, formulario y controles a 390 px, porque el ancho de la página puede ocultar un recorte, y a comprobar conservación a 1440 px.
- **Veredicto:** SHIP para revisión del borrador con suite, tipos, compilación, secretos y revisiones locales aprobados. El CI de la cabeza propia se comprueba tras subirlo. HOLD de producción: no se aplicó SQL ni se activaron servicios; SMTP propio sigue pospuesto, Groq exige confirmar retención cero y modalidad, los proveedores requieren ensayos reales y Kerr conserva carga manual.
