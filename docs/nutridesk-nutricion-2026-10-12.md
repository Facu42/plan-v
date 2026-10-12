# Nutriboost: planificación, intercambios, catálogo y documentos — 12/10/2026

Rama `codex/nutridesk-nutricion`. Implementación local desde la versión principal; no se publicó ni se aplicó la migración en una base hospedada.

## Funciones implementadas

- **Fórmula efectiva:** Mifflin-St Jeor conserva el comportamiento anterior. Harris-Benedict revisada, FAO/OMS/ONU, Katch-McArdle y basal de balanza cambian el cálculo real de basal, gasto y meta. Se exige aprobar la referencia de cada fórmula alternativa en la configuración del consultorio. Katch necesita porcentaje de grasa y balanza necesita basal medido; no se completan con estimaciones. Las constantes son las que ya existían en el repositorio, no coeficientes clínicos nuevos.
- **Persistencia segura:** el servidor y PostgreSQL recalculan; los números del cliente no deciden la meta. Se conserva publicación separada del borrador y actualización del objetivo del borrador del plan. Los parámetros faltantes/invalidables y fórmulas no aprobadas se rechazan.
- **Configuración:** referencias de fórmulas, seis micronutrientes y marca/logo/contacto propios, con versiones para impedir sobrescrituras desde otra sesión. La paciente y el administrador no reciben estas configuraciones.
- **Intercambios:** grupos propios de dos a cinco alternativas, cantidades en gramos y referencia revisada. Las composiciones/fuentes quedan congeladas al guardar el grupo. El editor de planes permite elegir grupo, alternativa e intercambios; agrega un componente alimentario real, con gramos, revisión y nota de grupo. La publicación continúa requiriendo revisión. No presume que todas las alternativas tienen exactamente los mismos nutrientes.
- **Momentos personalizados:** nombres de hasta cuarenta caracteres para los seis momentos estables; no permite nombres duplicados ni cambia las claves funcionales. Se guardan por versión, permanecen inmutables al publicar y pasan a la siguiente versión o al aplicar modelos. El editor, impresión y paciente muestran los nombres personalizados.
- **Micronutrientes:** el análisis existente suma los datos reales. Puede mostrar referencias cargadas y revisadas por la profesional, fuente/población y proporción respecto de esa referencia. No inventa rangos ni trata nutrientes ausentes como cero. Estas referencias del consultorio requieren criterio profesional para la paciente concreta; no son una nueva prescripción automática.
- **Catálogo paginado:** pantalla de Alimentos y selector del plan solicitan sólo una página con filtros y orden del servidor. El total y los indicadores se calculan sobre todo el catálogo autorizado. Se quitó el corte previo de cinco mil del lector legado. Prueba SQL con 5.100 alimentos y dos consultorios.
- **Fuente externa:** búsqueda explícita USDA Foundation/SR Legacy, vista de composición por 100 g e incorporación revisada a catálogo propio con identificador, procedencia y referencia de licencia. Se rechaza Branded y unidades incompatibles; faltantes permanecen vacíos. El servidor vuelve a consultar la entrada antes de guardar y rechaza un cambio respecto de la vista revisada. La clave es exclusivamente del servidor y no se transmite a la interfaz.
- **Documento:** nombre/logo/contacto del consultorio, nombres personalizados, nutrientes medios y gráfico de distribución desde la copia concreta. Se conserva el guardado real como PDF del navegador; **no** se genera un archivo con extensión PDF a partir de texto. La descarga directa sin diálogo de impresión sigue fuera de esta entrega.

## Contratos e integración

Registrar `registerNutritionCapabilityRoutes(app)` desde `server/nutrition-capabilities/routes.ts` en la API integrada. No se editó `server/index.ts`.

| Recurso | Contrato |
| --- | --- |
| Configuración | `GET/PUT /api/nutrition/settings`, guardado con `expected_revision` |
| Grupos | `GET/POST /api/nutrition/exchanges`, revisión explícita y referencias de alimentos |
| Alimentos paginados | `GET /api/foods/search`, filtros, página y hasta cien resultados por página |
| USDA | `GET /api/nutrition/external-foods`, detalle por identificador y `POST` con copia revisada |
| Meta | `formula`, `body_fat_pct` y `scale_bmr` opcionales en el contrato existente; ausencia de fórmula mantiene Mifflin |
| Plan | `meal_labels` opcional en borrador, revisión y copia publicada; claves de momentos anteriores conservadas |

Los destinos profesionales de Equivalencias y Configuración ahora montan componentes reales en `desarrollo?modulo=equivalencias` y `desarrollo?modulo=configuracion`. Para resolver conflictos de integración, conservar los nuevos imports y esas dos ramas específicas del render de `NutrigoShowroom`; conservar los demás destinos de los otros agentes.

La migración `20261011180000_nutrition_capabilities.sql` crea configuración/grupos propios, cálculo ampliado, búsqueda paginada y nombres versionados. Se comprobó en PGlite, incluyendo las migraciones anteriores. Reversión de aplicación: conservar tablas/columnas y volver al cliente anterior; no borrar configuraciones o versiones para revertir código.

## Límites y comprobaciones pendientes

- Cien grupos por consultorio, dos a cinco alternativas por grupo; hasta veinte intercambios por componente, con decimales y el límite previo de gramos/componentes del plan. Límite de grupos también se aplica en la base, serializado por consultorio.
- Los momentos personalizados son los seis existentes. No agrega un séptimo momento ni modifica el número de columnas del frame original de Nutrigo.
- Referencias numéricas aprobadas son ingresadas por la profesional con población y fuente. No se incluyó una nueva tabla normativa ni se implementó Kerr sin especificación validada.
- USDA necesita `FDC_API_KEY` válida, opcional en `.env.example`, y disponibilidad del proveedor. La navegación con gstack a la documentación oficial falló por DNS. **No hubo consulta/importación USDA real ni verificación en línea de su documentación en este entorno.** El adaptador y los límites fueron probados con respuestas sintéticas; antes de habilitarlo, verificar clave, documentación/licencia y una entrada real.
- Comparación visual 1440/390 y descarga PDF real desde navegador pendientes para la integración. No se afirma que las pantallas nuevas coincidan exactamente con un frame: configuración e intercambios usan controles existentes de Plan V con tokens Nutrigo. Los JSON originales del diseño no se editaron.
- Administrador y paciente quedan excluidos de la configuración y grupos. Compartir entre profesionales/delegación y recepción corresponde a otra entrega, no se declara resuelto aquí.

## Evidencia ECC y Regression Guard — paso 10

**RED conservado en esta rama:** `fb2c3c6` selección de fórmulas; `844a3de` persistencia y límites de consultorio; `4879c04` búsqueda paginada; `3a2e29b` fuente USDA; `3371676` nombres por versión; `872b1ed` documento con marca.

- **Flujos críticos verificados:** ✅ meta con fórmula y aprobación; ✅ grupos con fuentes congeladas; ✅ publicación y nueva versión de momentos; ✅ consulta de catálogo grande; ✅ rechazo de paciente/administrador; ✅ HTML de documento y conservación de copias anteriores. ⚠️ interacción de navegador y proveedor USDA real pendientes.
- **Regresiones:** 74 pruebas en nueve archivos de metas/PostgreSQL, planes, catálogo, editor, impresión y variabilidad del plan aprobadas. Cierre focal: 39 pruebas en diez archivos de fórmulas, contratos, SQL A/B, rutas, USDA, búsqueda y marca aprobadas. Se ejecutaron con un trabajador.
- **Contratos revisados:** entrada de meta validada en API/base, revisiones de configuración/grupos/alimentos, datos congelados y `meal_labels` en lectura/revisión/publicación/copia; campos opcionales conservan contratos anteriores.
- **Áreas frágiles:** acceso entre consultorios, aprobación clínica, revisiones vencidas, datos ausentes y publicaciones. Cinco pruebas SQL ejercitan recálculo ante resultados adulterados, aislamiento, alimentos ajenos, nombres inmutables y 5.100 alimentos. Cuatro pruebas de rutas ejercitan los flujos reales de guardado y denegación.
- **Migración:** aditiva, comprobada en base descartable; no aplicada afuera. Nombres publicados protegidos por trigger. Las nuevas tablas sólo conceden lectura propia; escritura mediante funciones que derivan la profesional de su sesión.
- **Fire test:** usar temporalmente Mifflin al elegir Harris produjo `1395` frente a `1455` y falló la prueba. Se restauró el código y el cierre focal pasó completo.
- **Automatizaciones:** pruebas permanentes para fórmula seleccionada, permiso/aislamiento, copias inmutables, grupos, páginas posteriores al alimento cinco mil, fuentes/unidades USDA y logos sin recursos remotos.
- **Verificación:** tipos aprobados; compilación aprobada (advertencias existentes de Zod/chunks); revisión de migraciones, secretos y `git diff --check` aprobados. Suite completa y revisión independiente las realizará el coordinador sobre la integración, para evitar ejecutar varias suites grandes simultáneamente.
- **Veredicto:** lista para integración local. **HOLD para publicación** hasta registrar las rutas, completar gate integrado, revisión independiente y recorrido de navegador, y obtener la autorización correspondiente para producción. USDA continúa apagado sin clave válida y comprobación real.
