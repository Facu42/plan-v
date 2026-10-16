# SARA 2 — implementación adicional

Fuente exacta: Ministerio de Salud, SARA 2 edición 2022, PDF SHA256 `14706a46e0262e2223b0c44d4c77c31090e3554cf63602fe58ab765f32b81c7f`. Investigación independiente: 930 registros, 39 componentes y sus referencias por celda. Se incorporan datos numéricos y citas; no se distribuye el PDF ni se declara una licencia comercial no comprobada.

## Plan y contratos

1. Pruebas antes del código: catálogo completo, carbohidratos disponibles, celdas ausentes, B12 ambigua, mililitros y copias históricas. Mantener evidencia RED/GREEN.
2. Datos grandes únicamente en servidor. Catálogo resumido paginado y detalle de componentes paginado con referencias, colores y alertas originales. Identificaciones derivadas: nunca presentadas como códigos oficiales.
3. Base congelada de 100 g o 100 ml. Cálculos por cantidad nativa; el volumen no es peso. Sin conversión de cocción/densidad ni inferencia de valores faltantes. Las recetas con volumen conservan peso desconocido y necesitan peso final medido para composición por 100 g.
4. SQL aditivo: sólo plataforma, colisión impide sobrescritura; permisos existentes del consultorio. Crear alimentos propios no permite falsificar metadatos institucionales. Planes publicados conservan sus copias.
5. Selector SARA 2 inicial; otras fuentes requieren elección explícita. IA culinaria permanece estimación salvo referencia exacta de catálogo revisada.
6. Verificar pruebas focales, tipos, compilación, migraciones y secretos; revisión independiente antes del PR. Producción sigue sin modificar.

## Flujos críticos y riesgos

- Catálogo → receta → plan → publicación: pruebas existentes y nuevas para base, revisión y snapshots.
- Dos consultorios y roles: RLS local, catálogo propio separado, plataforma de sólo lectura.
- Importación del dataset: checksum, 930 IDs únicos, seed idempotente, colisión bloqueada.
- Unidades/B12: mililitros nunca gramos; discrepancia impresa B12 sólo lectura.
- Históricos: no recalcular versiones previas ni reemplazar valores declarados.

Resultados propios, incidencias de fuente y paso 10: [verificación SARA 2](sara2-verificacion-2026-10-15.md). La entrega 8 incorpora el padre 7 final `5c8ea54`, con manifiesto de 18 pendientes y tres bases exactas. Suite completa propia final: 2.999 aprobadas, cero fallos, dos omitidas y 458 archivos. Revisión independiente de código y [QA 1440/390](sara2-qa-2026-10-16.md) aprobados sin P1/P2, conservando 1.787 huellas finales. El CI propio se comprueba después de subir el borrador; producción permanece pendiente de autorización y validación real.
