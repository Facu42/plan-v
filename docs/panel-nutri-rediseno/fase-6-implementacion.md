# Fase 6 · Plan de implementación

Objetivo: Asistente IA, Seguimiento, Mensajes y Progreso según el boceto aprobado. Rama `codex/panel-nutri-fase-6`, base main c09466b. Se implementa exclusivamente esta fase; 7–9 quedan fuera.

Arquitectura: mantener las operaciones de planes, mensajes, revisión y permisos. Agregar lecturas agregadas autorizadas y presentación aislada con tokens del panel. Las respuestas guardadas y destacadas necesitan persistencia por consultorio; su SQL se prepara y prueba localmente, sin aplicarlo en producción. La autorización para esa aplicación se pide sólo con la entrega concreta verificada.

Referencia: fase 6 y sección 5 de [plan aprobado](plan.md), bloques ia/seguimiento/mensajes/progreso de `design/panel-nutri/bocetos.html`. Poppins, paleta actual, 1440×900 y 390×844, ambos temas, movimientos 200–300 ms y sólo fundidos al reducir movimiento.

## 1. Contratos y resúmenes

- [ ] RED: medianoche argentina, más de veinte registros, días únicos, consentimiento, propios/ajenos/archivadas, valores ausentes distintos de cero.
- [ ] `src/types/accompaniment.ts`, `server/crm/accompaniment.ts` y `routes.ts`: lecturas paginadas de comidas propias con firma autorizada; hábitos/síntomas y días de la semana; progreso por período, altas y bajas.
- [ ] Gasto: sólo claves atribuibles a jobs propios y prefijo de cartera del actor actual, sin cache ni uso global ajeno. Error de lectura no se presenta como cero. Tope compartido de US$5 conservado.
- [ ] Recordatorios: selección autorizada de pacientes activas sin registros; confirmación previa, avisos in-app existentes, idempotencia y resultado parcial. No WhatsApp ni push de turno.
- [ ] GREEN focal y respaldo con Bitácora.

## 2. Mensajes guardados

- [ ] RED de validación, aislamiento de dos consultorios, revisión concurrente y ausencia de envío al insertar.
- [ ] Tabla por consultorio con RLS, revisión para evitar pérdida de cambios y favoritos propios. Migración nueva desde 20261019, índices y manifiesto.
- [ ] Editor de respuestas dentro de Mensajes. Sugerencia local identificada como tal; no reutilizar el copilot que carece del presupuesto y revalidación necesarios. Insertar conserva el borrador y requiere envío manual.
- [ ] Estilos profesionales en tres columnas; no cambiar la app paciente. Chat de ficha reutiliza las respuestas.

## 3. Cuatro pantallas

- [ ] Asistente: selector de paciente y contexto autorizado, generación menu_draft por API existente, recuperación/polling, vista privada real, editor con propuesta. Nueva conversación no elimina propuestas guardadas. Indicadores de cartera existentes disponibles.
- [ ] Seguimiento: tarjetas con fotos sólo autorizadas, revisión y comentario reales; estados/filtros/paginación, ánimo/síntomas, días, agua y actividad sin estimaciones inventadas.
- [ ] Progreso: períodos, cifras y gráficos con fuente/metodología explícitas, metas reales, altas/bajas y exportación CSV; conservar tabla anterior y errores separados de cero.
- [ ] UI scoped al panel, vacíos/errores/reintentos, teclado/foco, ambos temas y móvil.

## 4. Entrega

- [ ] Comparación navegable y capturas de las cuatro pantallas, ambos tamaños/temas. Datos ficticios, nunca producción.
- [ ] Revisiones independientes code-reviewer y reality-checker; corregir bloqueantes.
- [ ] Fire test controlado; suite completa, tipos, build, migraciones/manifiesto/vistas/secretos y e2e adecuados.
- [ ] Informe Regression Guard paso 10, Bitácora y PR propio. CI sobre la cabeza final. No aplicar SQL sin frase escrita; no activar proveedores ni modificar configuración de producción.

Flujos críticos protegidos: acceso/consultorio (pruebas existentes Auth/RLS), generación/revisión/publicación de planes (ai-jobs y e2e), revisión de comidas (API y e2e), mensajes/adjuntos/lecturas (existentes y e2e), mediciones y permisos (care/progress), gasto (spend/budget). Huecos nuevos a cubrir: resúmenes de fase 6, lote de avisos y persistencia de respuestas/favoritos. El boceto ya fue aprobado por Facundo; no se solicita nuevamente aprobación de diseño.
