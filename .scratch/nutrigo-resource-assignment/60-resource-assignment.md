# Corte 60 — Asignación y lectura de Recursos

Fecha: 2026-09-15

## Entrega

- `Guardado` profesional conserva los Planes B existentes e incorpora asignación de las seis guías editoriales de Recursos.
- La profesional puede seleccionar una guía y uno o varios pacientes activos.
- La API valida los identificadores, limita el lote a 100 pacientes, rechaza duplicados de entrada y evita crear una segunda asignación del mismo recurso.
- Cada asignación conserva `assigned_at`; la primera apertura paciente conserva `read_at` sin reescribirlo en aperturas posteriores.
- La paciente ve las guías asignadas en un bloque separado y la profesional ve estado y fecha por paciente.
- Las operaciones nuevas tienen permisos separados: `assign_resource` para nutricionista y `read_resource` para la paciente vinculada.
- El modo Supabase responde `501` hasta aprobar tablas, RLS y auditoría en el contrato 016. No se aplicó SQL ni se simuló persistencia.

## Privacidad y seguridad

- Las asignaciones sólo contienen ID editorial, ID de paciente y marcas de tiempo.
- No se incorporan nombre, notas, objetivos, mensajes ni datos clínicos a URL compartibles.
- Una lectura de Sofía no modifica el estado de Marina.
- Los IDs editoriales desconocidos fallan cerrados.
- La asignación masiva valida el lote completo antes de mutar el store demo.

## QA de navegador

Ejecutado con API `3015`, Vite `5185` y Chrome DevTools aislado `9244`.

Recorridos aprobados:

1. apertura de `Guardado` profesional;
2. selección y asignación de una guía a dos pacientes;
3. visualización y lectura desde el rol paciente;
4. retorno profesional con Sofía en leído y Marina pendiente;
5. tema oscuro y responsive a 390 px, sin overflow horizontal.

Evidencia visual:

- `professional-assignment-1200-fixed.png`
- `patient-assigned-dark-390-final.png`

La revisión visual del corte no detectó clipping u overflow bloqueante. Esto no concede la aprobación visual global de Plan V.

## Gate final

```text
61/61 archivos
136/136 suites
319/319 pruebas
TypeScript frontend y servidor aprobado
build de producción: 121 módulos
npm audit: 0 vulnerabilidades
91 paquetes con firmas verificadas
46 paquetes con attestations verificadas
git diff --check aprobado
browser QA: 5/5 recorridos, 0 errores
```

## Límite vigente

Asignaciones y lecturas se conservan sólo en memoria demo y se reinician con el servidor. Producción continúa bloqueada por contrato 016, aislamiento, RLS, autorización y auditoría.
