# Corte 36 — Cierre del showroom profesional y sus accesos

## Alcance cerrado

La conexión operativa ya estaba presente al retomar este corte (`ProfessionalActions`, `professional-summary`, `crm-entry` y `initialEntry` del CRM). Se inspeccionó y verificó, sin reescribirla ni atribuir una migración visual completa.

- Selector y lista de pacientes activos, separados del menú principal.
- KPIs agregados derivados del store: pacientes activos, pendientes propios, media de adherencia y consultas.
- Seis accesos: ficha, comidas, plan, consultas, directorio y objetivos.
- `CrmEntry` valida paciente activo y módulo/pestaña. No reemplaza la autorización de API.
- Apertura del CRM existente sin recargar sesión; regreso al showroom conserva el paciente de origen.
- Once módulos visibles y navegables; formularios operativos conservan su diseño anterior.

## Añadido en este corte

- Pruebas de caracterización de `ProfessionalActions`: payload de los seis accesos para un paciente distinto del primero, deshabilitación de selección inválida/archivada y selector/métricas/aviso demo.
- Harness reproducible `verify.py` para navegación y responsive, más `verify-flows.py` para guardado y aislamiento.
- Backlog y tarea 1.4 cerrados para revisión; siguiente tarea 1.5, aprobación visual.

## Evidencia real

- `verification.json`: diez capturas (1440/1024/800/390/320, claro/oscuro) y seis accesos operativos. Sin desborde horizontal en el showroom profesional.
- Inspección visual directa de `light-1440.png` y `dark-390.png`: selector y acciones legibles, sin solapamientos visibles.
- `flows.json`: once módulos únicos abiertos; plan guardado vía UI y leído desde API, visible también en preview paciente; turno editado y leído desde API/preview; panel de revisión de Marina abierto y cerrado.
- Ediciones de plan/consulta restauradas mediante UI, con lectura posterior. Se conserva el historial demo que generan estas operaciones; no se borró historial.
- Se comparó el registro completo de Sofía antes/después: sin cambios. Cambio de contexto a su plan sin datos de Marina en el área de ficha.
- No se confirmó una revisión clínica ni se enviaron mensajes durante este QA; la apertura del panel no se presenta como una revisión guardada.
- Sin errores JavaScript ni promesas rechazadas durante los flujos comprobados.
- Gate: **38 archivos / 203 pruebas**, TypeScript frontend/backend y build **120 módulos** aprobados.
- Auditoría: **0 vulnerabilidades**, 90 firmas y 45 attestations verificadas. `git diff --check` aprobado, con avisos previos LF/CRLF.

## Límites

- DEV/demo, API con `supabase: false` y `ai: false`; no se conectaron datos reales ni se aplicó SQL.
- Este corte cierra el acceso operativo del showroom, no la adaptación visual de todos los módulos, ni un calendario/mensajería nuevos.
- QA responsive profesional corresponde al showroom; no acredita paridad visual móvil de todos los formularios heredados.
- Pendiente aprobación visual 1.5 antes de reemplazar rutas; contrato ampliado/RLS y producción siguen bloqueados.
- Se cerró únicamente Chrome de QA en 9227; Vite queda disponible en 5180 y se respetó la API existente en 3010. Sin commit ni push.
