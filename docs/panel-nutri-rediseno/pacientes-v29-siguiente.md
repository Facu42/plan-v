# Pacientes v29 · plan de lo que sigue

Se pidió el 27/10 (Facundo): sumar lo que quedó afuera de Pacientes. Una rama y un PR por paso. Ninguno toca la base sin su frase.

| Paso | Qué | Dato real | Base | Estado |
|---|---|---|---|---|
| 1 | **Patologías en el resumen**: la nota de condiciones que la paciente escribe en su ficha de ingreso (`conditions_note`) aparece en el bloque «Patologías». | `GET /api/patients/:id/intake`, solo de la paciente abierta | No | Propuesto, primero |
| 2 | **Patologías en la tabla**: la columna muestra las dos primeras como etiquetas. Necesita traer la nota de todas las pacientes en una sola consulta. | Campo nuevo en `directory-summary` (lote de 50) | No (solo lectura de lo que ya existe) | Después del 1 |
| 3 | **Patologías cargadas por la nutri**: lista propia en la historia clínica, con alta, edición y etiquetas de colores del boceto (celíaca, hipotiroidismo…). | Tabla nueva `patient_conditions` | **Sí**: migración aditiva con su frase | Solo si decide dejar de depender de la nota de la paciente |
| 4 | **Plan por vencer sin «—»**: mientras cargan los planes, la solapa muestra «…» y no un guion. | Ya existe | No | Chico |
| 5 | **Grupos y etiquetas** del boceto. | No existe la función | Sí | Fuera hasta que lo pida |

## Hecho el 27/10 junto con este plan

- Celular en claro: el resumen abierto se veía cortado (la fila del resumen ocupaba 7 columnas en una tabla de 3) y el fondo viejo asomaba rosado en las esquinas de la tarjeta. Corregido, con divisor arriba entre las tres tarjetas apiladas.
- Encabezado de Inicio: si la próxima consulta no es hoy dice «mañana» o «el vie 30» además de la hora.
- Pruebas de punta a punta que fallaban en main: dos dependían del día de la semana (abrían el editor en «hoy» y esperaban el lunes), una medía el diálogo de Ayuda mientras todavía se deslizaba.
