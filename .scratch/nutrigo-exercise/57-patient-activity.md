# Corte 57 — Actividad autodeclarada

## Alcance

- `Ejercicio` paciente dejó de mostrar «Pronto».
- `ShowroomExercise` registra actividad, duración, intensidad percibida y nota opcional.
- El resumen usa siete días calendario reales y el historial sólo consume `activity_logs` del paciente.
- `Actividades` profesional muestra los registros del paciente seleccionado en modo de lectura.
- No se implementaron rutinas, series, repeticiones, gasto energético ni prescripción.

## Datos y autorización

- Nuevo `ActivityLog` compartido por cliente y servidor.
- Endpoint demo: `POST /api/patients/:id/activities`.
- Validación: actividad 2–80 caracteres, duración 1–600 minutos, intensidad `suave | moderada | intensa`, nota hasta 500 caracteres.
- Acción de autorización `log_activity`: paciente activo únicamente sobre su propio recurso.
- Acceso bloqueado por cobranza no puede mutar salud.
- La respuesta paciente pasa por `toPatientSelfView`.
- En Supabase el endpoint devuelve 501: falta incorporar `activity_logs`, RLS, retención y auditoría al contrato 016 revisado. El draft no fue aplicado.

## QA navegador aislado

Servicios `3013`/`5183`, Chrome `9240`:

```json
{"checks":7,"views":6,"patient":"pat-sofia","created":"320057a9-d2b3-4d4d-b04d-4589413e93e3","otherUntouched":true,"private":17,"errors":[]}
```

Verificado:

- vacío honesto inicial;
- alta desde formulario y read-back API;
- duración, intensidad y nota conservadas;
- otro paciente intacto;
- lectura profesional aislada en Actividades;
- ausencia de 17 valores profesionales privados en vista paciente;
- escritorio, tablet/móvil y temas claro/oscuro;
- sin overflow horizontal a 390 px;
- resumen actualizado a 1 sesión y 35 minutos.

Capturas:

- `exercise-light-1440.png`;
- `exercise-dark-390.png`.

## Gate

- 59/59 archivos;
- 132/132 suites;
- 305/305 pruebas;
- TypeScript frontend/servidor aprobado;
- build: 121 módulos;
- npm audit: 0 vulnerabilidades;
- firmas y attestations aprobadas;
- `git diff --check` aprobado.

## Pendiente real

- contrato 016 y RLS para persistencia;
- política de retención/auditoría;
- acreditación verificable de profesional habilitado;
- biblioteca y detalle de ejercicios;
- asignación y progreso de rutinas.
