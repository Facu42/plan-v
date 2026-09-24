# 42 — Directorio de Pacientes operativo en el nuevo diseño

## Implementado

- `ShowroomPatients.tsx` reemplaza la tabla de solo lectura del showroom por el directorio operativo completo: resumen (activos / necesitan atención / con consulta / archivados), filtros con conteos, búsqueda externa desde el encabezado, y acciones por paciente (Ver seguimiento, Editar, Archivar/Restaurar).
- Reutiliza `filterDirectoryPatients` y `getPatientDirectoryMetrics` de `crm/crm-patients.ts` (misma lógica que el CRM legacy, sin duplicar).
- Diálogos nuevos con estilo del showroom: `ShowroomPatientCreate` (nombre/email/objetivo, aviso «no se envía ningún email») y `ShowroomPatientEdit` (nombre/estado/etapa/horario sensible/Plan B/próximo foco). Escape cierra, backdrop no cierra mientras guarda, errores con `role=alert`.
- `openOperation` desvía el módulo `pacientes` a la nueva vista: el acceso «Editar pacientes» de Mi trabajo y el módulo Pacientes del sidebar ya no abren el editor legacy para este módulo. El resto de módulos sigue en el puente anterior.
- Estilos nuevos en `showroom-patients.css` con tokens `nv-*`; tabla de 5 columnas que apila a 2 en ≤760px y a 1 en ≤360px.
- Sin cambios de API, contratos, persistencia ni otros módulos. `archived_at` sigue siendo soft-delete reversible.

## Verificación real

- RED: prueba nueva falló por módulo inexistente; GREEN: 7 pruebas de composición (resumen, filtros, acciones accesibles, archivados sin acciones operativas, atención <70, búsqueda, diálogos con campos precargados).
- Navegador (`.scratch/nutrigo-patients/verify.py`): 8 checks PASS — sidebar abre la vista nueva sin `.crm-patients` legacy; búsqueda Marina; alta «Paciente QA» con `billing_status=pending` y aviso «todavía no enviada»; edición de estado/etapa/próximo foco con lectura exacta de API y registro de Sofía sin cambios; archivo en dos pasos → ausente de Activos y presente en Archivados; restauración reversible; «Ver seguimiento» selecciona el contexto; «Editar pacientes» del toolbar aterriza en la vista nueva; paciente QA dejado archivado para no ensuciar el demo.
- 8 vistas (claro/oscuro × 1440/800/390/320): sin overflow horizontal, resumen de 4 métricas y 3 filtros presentes en todos los tamaños. Errores JS/promesas: ninguno.
- Inspección visual de capturas NO realizada: la herramienta de visión del entorno devolvió 404 de enrutado en este corte. Las capturas quedan en esta carpeta para revisión del usuario.
- Gates completos: 241 pruebas / 44 archivos, `tsc` frontend+server, build 121 módulos, `npm audit` 0 vulnerabilidades, firmas 91 verificadas / 46 attestations, `git diff --check` OK (avisos LF/CRLF preexistentes en archivos ajenos).

## No incluido / pendiente

- El módulo Fichas (historial, notas privadas) y los demás editores siguen en el puente legacy; es el siguiente corte de la secuencia («ficha»).
- No hay aprobación visual del directorio ni del conjunto. Sin Supabase, datos reales, emails, commits ni publicación.
