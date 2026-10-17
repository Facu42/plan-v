# Arranque del trabajador integrado · 14/10/2026

La entrega final de operaciones reemplaza los recordatorios anteriores por la cola de comunicaciones, conservando consultas, organización documental, agenda, fotos y procesamiento general. Se conserva y actualiza la prueba del consumidor real `startJobWorker`; no se elimina al sustituir el transporte.

Tres casos ejecutados sobre el trabajador real con temporizadores controlados y proveedores simulados: inicio duplicado no crea dos intervalos; los módulos se invocan y no reciben nuevos ticks después de detenerlo; un lote pendiente no se solapa; el siguiente lote vuelve a estar disponible después de terminar o rechazar, sin registrar contenido privado del error. No se enviaron correos ni se contactaron proveedores.

Fire test local: se desconectó temporalmente la llamada a comunicaciones en la copia aislada. Los tres casos fallaron (RED). Se restauraron los bytes exactos del trabajador y los tres aprobaron (GREEN). Evidencia temporal: `planv-worker-wiring-fire-red-20261014.json` y `planv-worker-wiring-fire-green-20261014.json`.

Tipos, suite completa, compilación, revisión independiente y permisos se verifican nuevamente al cerrar el paquete integrado y la entrega de operaciones. Estos tres casos focales no prueban entrega SMTP, voces reales, proveedores externos ni drenado de trabajos pendientes durante un cierre del proceso. Sin SQL ni cambios de producción.

Regression Guard: consumidor y contratos del trabajador cubiertos; riesgo principal de doble envío evitado al usar una sola cola persistente, sin presentar aceptación como recepción en bandeja. Esta prueba no sustituye las pruebas de reservas, permisos, presupuesto y resultados inciertos de cada módulo. Borrador revisable; habilitación de canales y producción pendiente de configuración, evidencia real y autorización escrita.
