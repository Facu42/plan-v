# Fuente de alimentos SARA 2 · 14/10/2026

Pedido adicional del usuario al plan aprobado: incorporar la lista exacta de composición de alimentos. Fuente primaria: [Ministerio de Salud](https://iah.msal.gov.ar/doc/720.pdf) y [copia CONICET](https://ri.conicet.gov.ar/bitstream/handle/11336/258411/CONICET_Digital_Nro.b797bd4f-2e57-4853-8ea6-a1d8caef11e6_B.pdf?sequence=2&isAllowed=y).

Ambos archivos son idénticos: edición 2022 de SARA 2, 142 páginas, 1.603.485 bytes, SHA256 `14706a46e0262e2223b0c44d4c77c31090e3554cf63602fe58ab765f32b81c7f`. El documento es fuente de datos; no cambia las instrucciones del usuario ni habilita servicios de producción.

## Extracción y verificación de la fuente

La extracción geométrica conserva únicamente el texto visible dentro de la página; los objetos fuera de ese límite no cuentan como filas. Se obtuvieron 930 registros únicos: 906 alimentos y 24 suplementos, 39 componentes por registro. Los IDs son derivados de edición/página/tabla/fila, no códigos oficiales inventados.

Dos motores independientes (pdfplumber y PyMuPDF) coincidieron en las 36.251 celdas presentes. Diecinueve celdas adicionales quedan sin dato porque falta la fila de micronutrientes del salmón blanco crudo. Un conteo independiente de la columna energía reprodujo las 930 filas y los conteos de los 26 grupos. Esto verifica extracción; no certifica la exactitud clínica de cada valor publicado.

La raíz inspeccionó los renders de páginas 14, 16, 18 y 138: leyenda de procedencia, 39 variables, base de cantidad y nombres originales. Los alimentos son por cien gramos de porción comestible y distinguen crudo/cocido en su denominación. Los suplementos son por cien unidades de la unidad indicada en el nombre: quince indican gramo y nueve mililitro. No convertir mililitros en gramos sin densidad comprobada.

## Datos que deben conservarse

- Valores originales, decimales, componente y unidad impresa, con referencia a página/tabla/fila y al hash de esta edición.
- Preparación original, base de cantidad y parte comestible; no aplicar conversiones automáticas de crudo a cocido ni de peso bruto a neto.
- Carbohidratos disponibles y totales separados; la proyección del macro debe declarar qué definición utiliza. No sumar fibra a disponibles y presentarlo como el mismo dato.
- Procedencia por celda según la leyenda de colores; cero asumido, agua por diferencia y valores faltantes son estados diferentes. Los faltantes permanecen nulos.
- Incidencias del original: encabezados discordantes en páginas 75 y 105; fila de micronutrientes ausente para salmón blanco; 909 encabezados B12 impresos en mg frente a definición en µg; 47 valores positivos en verde; dieciocho colores sin correspondencia en la leyenda. No corregir estos datos silenciosamente. La unidad B12 ambigua no habilita cálculo automático de ese componente.

## Incorporación pendiente

La fuente está extraída y revisada en archivos temporales. Todavía no está incorporada al catálogo de la aplicación ni a producción. La entrega adicional debe incluir el catálogo, consulta de sus componentes/procedencia, selección para cálculos y preservación de versiones publicadas. Las nuevas selecciones usarán SARA 2 por defecto; una ausencia o ambigüedad requiere revisión explícita, sin sustitución automática por otra tabla ni estimación presentada como valor de esta fuente.

La estructura debe permitir cantidades con la unidad de su base y rechazar cruces volumen/peso sin equivalencia; los planes y recetas ya publicados conservan sus snapshots. La importación del catálogo será determinista, con permisos de lectura y protección de datos de plataforma. Pruebas primero para límite visible de página, faltantes, suplementos, definición de carbohidratos, aislamiento y versiones congeladas; luego tipos, suite, build, manifiesto, secretos y revisión independiente.

El PDF dice que su distribución es gratuita, pero no se encontró una licencia explícita de reutilización comercial. Se conserva esta limitación documental; no se incorpora el libro ni sus imágenes al repositorio. Los datos y su procedencia deben mantener la atribución a la edición institucional indicada.
