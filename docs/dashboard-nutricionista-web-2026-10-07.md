# Dashboard de la nutricionista: desarrollo web

Actualizado el 7 de octubre de 2026.

## Alcance autorizado

Facundo confirmó desarrollar todo el dashboard profesional en la web de escritorio. Mobile queda para otra etapa. Academy se excluye. Se conserva la identidad de Plan V y se consulta cualquier problema concreto de comodidad antes de consolidar el flujo afectado.

## Orden de trabajo

1. Alimentos propios, suplementos, fuente de valores y medidas caseras.
2. Recetas, ingredientes, porciones y versiones.
3. Planificación, objetivos, editor semanal, publicación y PDF.
4. Ficha, consentimiento, mediciones, estudios y recomendaciones.
5. Seguimiento, señales e Inicio con acciones sobre pacientes.
6. Comunicación, búsqueda y asistente con confirmación de acciones.
7. Agenda, reservas, página pública y cobranzas.
8. Modelos, equivalencias, recursos, ayuda, reportes y permisos de equipo.

Antes de cada apartado se contrasta la comparación v3 con código y recorridos actuales. No se reconstruyen funciones que ya funcionan. Una rama y un PR por apartado; no se modifica main directamente.

## Alimentos: avance local

Rama: codex/nutri-alimentos. Catálogo separado de los ingredientes existentes para proteger recetas y planes publicados. Crear y editar alimentos propios, procedencia obligatoria, nutrientes por 100 g, distinción entre cero y valor desconocido, medidas personalizadas en gramos y búsqueda sin distinción de acentos. API con aislamiento profesional, control de revisión y reintentos. Migración preparada y comprobada en una base descartable; no aplicada en producción.

Verificación actual: 6 archivos del módulo y navegación, 16 pruebas aprobadas. Suite general: 256 archivos, 1455 pruebas aprobadas y dos omitidas. Comprobación de tipos, compilación y control de migraciones aprobados. Prueba de escritorio con datos ficticios: crear alimento, guardar medida Cucharada = 10 g, calcular dos medidas = 20 g y 76 kcal; los nutrientes desconocidos conservan «Sin dato». El alimento y su medida se conservaron después de reiniciar la API de demostración. Revisión de código: corregida lectura incompleta por límite del servidor mediante páginas y conteo exacto. No se declara la entrega publicada.

## ECC

Referencia local del repositorio affaan-m/ECC: ef648e01899ba3e8dc6371642deaaf64b4477775. Se aplican investigación de piezas existentes, pruebas antes de implementar, revisión de código y verificación antes de declarar terminado. No se instalaron hooks globales. Las reglas y decisiones de Plan V prevalecen.

## Pendientes y límites

- Diseño de escritorio pausado por decisión de Facundo pendiente: eliminar la franja vacía junto al menú y revisar el selector de paciente en el catálogo general. Se mostró captura y se recomendó catálogo amplio sin selector. El ajuste no se implementa hasta resolverlo con él.
- Actualizar la matriz de faltantes de cada apartado antes de desarrollarlo.
- La decisión móvil «Volver al catálogo» queda documentada para la etapa mobile y no bloquea esta entrega web.
- El relevamiento de Nutriboost utilizó pantallas y transcripción automática. La escucha directa completa del audio sigue pendiente; no se afirma un relevamiento exhaustivo.
- Base y configuración de producción y servicios pagos requieren su autorización específica. No se integran ni publican automáticamente los cambios.