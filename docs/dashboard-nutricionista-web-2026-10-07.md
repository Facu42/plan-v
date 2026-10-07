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

Verificación actual: 7 archivos del módulo y navegación, 18 pruebas aprobadas. Suite general: 257 archivos, 1457 pruebas aprobadas y dos omitidas. Comprobación de tipos, compilación y control de migraciones aprobados. Prueba de escritorio con datos ficticios: crear alimento, guardar medida Cucharada = 10 g, calcular dos medidas = 20 g y 76 kcal; los nutrientes desconocidos conservan «Sin dato». El alimento y su medida se conservaron después de reiniciar la API de demostración. Revisión de código: corregida lectura incompleta por límite del servidor mediante páginas y conteo exacto. No se declara la entrega publicada.

## ECC

Referencia local del repositorio affaan-m/ECC: ef648e01899ba3e8dc6371642deaaf64b4477775. Se aplican investigación de piezas existentes, pruebas antes de implementar, revisión de código y verificación antes de declarar terminado. No se instalaron hooks globales. Las reglas y decisiones de Plan V prevalecen.

## Pendientes y límites

- Diseño de escritorio resuelto: Facundo pidió contrastarlo con Nutriboost y aprobó la propuesta resultante. Implementada tabla compacta centrada con márgenes moderados, sin selector de paciente en Alimentos, cuatro indicadores, pestañas Alimentos/Suplementos, filtros, orden y columnas funcionales y detalle/formulario en ventana. Ver capturas y comprobaciones debajo.
- Actualizar la matriz de faltantes de cada apartado antes de desarrollarlo.
- La decisión móvil «Volver al catálogo» queda documentada para la etapa mobile y no bloquea esta entrega web.
- El relevamiento de Nutriboost utilizó pantallas y transcripción automática. La escucha directa completa del audio sigue pendiente; no se afirma un relevamiento exhaustivo.
- Base y configuración de producción y servicios pagos requieren su autorización específica. No se integran ni publican automáticamente los cambios.
## Comparación solicitada antes del ajuste visual

Facundo pidió comparar con Nutriboost antes de modificar. [Capturas, diferencias y propuesta para resolver juntos](comparacion-alimentos-nutriboost-2026-10-07.md). Facundo aprobó la estructura comparada y se aplicó al catálogo; la identidad visual de Plan V se conserva.

## Verificación final de la web

- Búsqueda sin tildes: «lacteos» encuentra el yogur ficticio. Categoría Cereales devuelve arroz y avena. Origen Plataforma, sin registros importados, muestra cero resultados y permite limpiar filtros.
- Orden por energía: 380, 360, 60, 52 y luego el alimento sin dato; nunca convierte un desconocido en cero.
- Columnas: ocultar Energía y mostrar Sodio cambia los encabezados y los valores; restaurar conserva los alimentos.
- Pestañas: flechas de teclado cambian Alimentos/Suplementos y mueven el foco. Alta de suplemento abre el tipo correcto y actualiza su contador y pestaña al guardar.
- Ventana: diálogo nativo con foco contenido, bloqueo de desplazamiento del fondo y Escape con retorno al alimento. Nuevo formulario enfoca Nombre. Escape con borrador pide confirmación: cancelar conserva los datos y confirmar descarta sin crear un registro.
- Edición: valor de energía negativo es rechazado sin cerrar ni perder cambios; al corregirlo se guarda la marca de la avena y vuelve a su detalle.
- Cantidad: dos cucharadas de 10 g = 20 g, 76 kcal, 2,6 g de proteínas, 12 g de carbohidratos y 1,4 g de grasas; fibra sin dato conserva su estado.
- Escritorio 1440 y 1280: sin desborde horizontal de página ni tabla con columnas iniciales. Las columnas adicionales usan desplazamiento dentro de la tabla. Sin errores de consola durante los recorridos comprobados.
- Movimiento: transición breve; regla de reducción de movimiento comprobada en el código. La herramienta de navegador no permite emular esa preferencia; no se declara comprobación dinámica.
- Revisión de código aprobada y revisión de funcionamiento local favorable. No se publica ni se aplica SQL en producción.

Capturas con datos ficticios: [catálogo a 1440](evidencia-alimentos/plan-v-tabla-1440.png), [catálogo a 1280](evidencia-alimentos/plan-v-tabla-1280.png), [detalle y cálculo](evidencia-alimentos/plan-v-detalle-1440.png).

Esta entrega cubre el catálogo propio y su presentación. Bases externas autorizadas, referencias de %VD, ampliar composición y conectar ingredientes/recetas/planes continúan en el plan. El archivo de demostración local debe ser propio de esta rama: las copias antiguas con dominios diferentes se conservan y se rechazan como incompatibles; no se sobrescriben automáticamente.