# Corte 56 — Mensajería Nutrigo operativa

## Auditado e implementado

- Se auditó `NutrigoMessages`, `message-send`, el store, `api.sendMessage`, rutas servidor y contrato 016 antes de asumir pendiente la mensajería.
- El hilo ya enviaba mensajes reales en memoria para ambos roles, actualizaba la conversación y mantenía el paciente aislado.
- Se confirmó el inbox profesional multipaciente con búsqueda y selección; no se creó un dominio duplicado.
- El perfil contextual ahora abre Ficha y Consultas del paciente seleccionado para la profesional.
- El perfil paciente abre su Agenda de sólo lectura.
- En móvil paciente se eliminó la tarjeta vacía de conversaciones; permanecen el hilo y el compositor accesibles.
- No se inventaron estados de entrega/lectura: el modelo actual sólo confirma envío y `sent_at`.

## QA de navegador aislado

Servicios usados: API `3012`, frontend `5182`, Chrome `9239`; todos cerrados después del corte.

```json
{"checks":6,"views":6,"patient":"pat-sofia","other":"pat-marina","private":14,"errors":[]}
```

- Envío paciente verificado por lectura exacta de API (`from: patient`, `sent_at` presente).
- Búsqueda, selección y envío profesional verificados por API (`from: vero`, `sent_at` presente).
- El paciente ajeno permaneció intacto tras cada envío.
- Accesos contextuales verificados a Agenda, Ficha y Consultas.
- Catorce valores privados profesionales ausentes del DOM paciente.
- Temas claro/oscuro y anchos 1440/800/390 sin overflow horizontal.
- Capturas inspeccionadas sin defectos bloqueantes:
  - `messages-light-1440.png`
  - `messages-dark-390.png`

## Gate

- 57 archivos, 128 suites y 299 pruebas aprobadas.
- TypeScript frontend/servidor aprobado.
- Build de producción aprobado: 121 módulos.
- `npm audit`: 0 vulnerabilidades.
- Firmas de 91 paquetes y 46 attestations verificadas.
- `git diff --check` aprobado.

## Límites vigentes

- Sin estados persistidos de entrega/lectura ni contadores de no leídos.
- Sin adjuntos, multimedia ni archivos compartidos; requieren Storage privado, contrato y RLS.
- La memoria demo no es persistencia de producción.
- La aprobación visual global de Nutrigo continúa pendiente.
