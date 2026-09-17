# Corte 35 — Composición Nutrigo con identidad Plan V

## Entregado

- Vista navegable en `http://127.0.0.1:5180/?design=nutrigo` (ingresar con Continuar en modo demo).
- Disponible solo en desarrollo, sin sesión real y con backend en memoria; excluida del build productivo. No modifica autenticación, RLS ni contratos.
- Nuevo layout con sidebar, topbar, tarjetas planas, métricas, anillos, barras y panel diario. Logo oficial y colores de Plan V, sin incorporar assets del kit ni fuentes externas.
- Dashboard paciente y vistas de lectura de plan semanal, diario, conversación, progreso y consulta existente.
- Base profesional: once módulos visibles, directorio con búsqueda, selección multipaciente y datos del paciente elegido. Los módulos aún no migrados muestran un estado explícito de pendiente.
- Base reutilizable: botón, card, badge, estado vacío, barra de progreso, métricas, anillo y barras.
- CSS aislado bajo `nv-*`: las pantallas actuales conservan su diseño y comportamiento.
- Proyección explícita de datos seguros: excluye notas profesionales, historial privado, mensajes no enviados y registros ajenos.
- Calorías solo de comidas revisadas del día; no se inventan objetivos nutricionales.

## Verificación

- TDD inicial del modelo y componentes: rojo por módulos ausentes; verde tras implementación.
- Contraste secundario corregido con prueba roja/verde; `#59685f` alcanza al menos 4,5:1 sobre las superficies claras verificadas.
- Suite: 35 archivos, 193 pruebas aprobadas; TypeScript frontend/backend y build aprobados.
- Auditoría: cero vulnerabilidades; firmas y attestations verificadas.
- Browser Harness: dashboard en 1440/800/390/320, claro/oscuro, sin overflow horizontal.
- Navegación de plan/diario/mensajes; búsqueda sin coincidencias; búsqueda de Marina y cambio de contexto; menú móvil; foco de teclado visible.
- Comprobados los once módulos tanto en la navegación profesional nueva como en el CRM original.
- Sin errores JS ni promesas rechazadas durante el flujo. Ver `verification.json`; diez capturas reales guardadas junto a este documento.
- `git diff --check` aprobado (solo advertencias LF/CRLF previas).

## Límites y siguiente corte

- Es una vista de diseño de solo lectura: no agrega envío, edición, compras o prescripciones nuevas. Los flujos completos siguen en la aplicación actual.
- Las ilustraciones de comidas son marcadores SVG, no fotografías finales; no se reutilizaron imágenes de Nutrigo.
- El menú semanal lateral muestra los días presentes en el plan, no promete un calendario mensual implementado.
- Falta terminar el showroom profesional: navegación a acciones operativas, ficha/edición/revisión real y QA responsive profesional.
- Falta aprobación visual antes de reemplazar rutas. La persistencia productiva sigue bloqueada por contrato 016/RLS.
- Próxima tarea registrada: 1.4 en `tasks/todo.md`.
