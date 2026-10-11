# Decisiones de producto (fuente única para los hilos de paciente y de panel)

Este archivo reúne las decisiones de Facundo sobre cómo se conectan la app de la paciente y el panel de la
nutricionista. Antes de implementar algo de la lista, se revisa acá. Si una decisión cambia, se cambia acá y se avisa.

## Decididas el 2026-10-10 (Facundo: «Tómalas»)

Facundo pidió tomar las recomendaciones de la definición del producto (D1 a D7) después de revisar que no hubiera
nada decidido o desarrollado antes. Se revisó: el hilo del panel había dejado D1–D7 como «pendientes, no se convierten
en decisiones automáticamente» ([coordinación](coordinacion-paciente-dashboard-2026-10-08.md)). Con esta orden pasan a
ser decisiones, con estas aclaraciones de lo que ya existe:

| # | Decisión | Qué ya existe | Qué falta | Dueño |
|---|---|---|---|---|
| D1 | La paciente ve el **objetivo y su estado**; el **avance** lo carga la profesional a mano, con nota. Se guarda en la base. No es el objetivo energético del plan. | En producción solo se guarda el texto del objetivo (`goal`). La pantalla del panel ya envía estado, avance y nota. | Guardar estado, avance e historial (migración) y mostrarlo en la app de la paciente. | Panel + paciente |
| D2 | **Una cuota impaga no bloquea** la app. Solo bloquea si la profesional corta el acceso. (Reemplaza lo que decía `mvp-v0.md`.) | Aviso de cuota en el banner, en el menú y en Pagos; acceso y cuota son cosas separadas. | Revisar que ninguna pantalla vacíe el Inicio por deuda; aviso de cuota en celular. | Paciente |
| D3 | Avisos **dentro de la app** (campana) **y por correo**. Sin WhatsApp por ahora. | Campana real con mensajes sin leer, consulta por confirmar y cuota (PR #88). | Sumar recurso asignado y plan nuevo a la campana; correo. | Paciente |
| D4 | La paciente puede **corregir o borrar** una comida o medida propia **mientras no esté revisada**; después, pedir corrección a la profesional. | Nada. | Rutas, reglas en la base y pantalla. | Paciente + servidor |
| D5 | El **diario de texto funciona sin permiso de IA**; la IA solo con permiso. | Hoy toda comida pasa por la IA y exige el permiso. | Camino sin IA en el servidor y en el registro de comida. | Paciente + servidor |
| D6 | Paciente **archivada**: se le avisa que su cuenta está archivada y no puede enviar mensajes. | La API responde bien y nadie ve el mensaje. | Bloqueo del envío y aviso. | Paciente + servidor |
| D7 | Plan nuevo: la paciente **ve qué cambia**, se le **avisa**, y **sigue viendo el anterior hasta que empiece el nuevo**. | Publicar archiva el anterior entero. | Vigencia por fecha, aviso y vista de cambios. | Panel + paciente |

## Decididas antes

| Fecha | Decisión |
|---|---|
| 2026-10-08 | Las fotos de ingredientes se muestran en la app como **desarrollo futuro**; hoy solo se generan. |
| 2026-10-08 | Foto de plato: **se deja el modelo gratuito actual**; más adelante se evalúa otro. |
| 2026-10-08 | Actualizar el objetivo energético del borrador del plan **automáticamente** al confirmar la meta; objetivos **sin exigir peso numérico**. |
| 2026-10-08 | El panel de la nutricionista y la administración las desarrolla otro hilo; el hilo de la paciente no las toca. |
| 2026-10-07 | La app de la paciente usa el código de cada frame de Nutrigo tal cual; lo que Figma no dibuja se arma con piezas del archivo. |

## Cómo se aplican

- Cada decisión se implementa en una rama y un PR; las que tocan la base esperan la frase escrita de Facundo.
- Un solo responsable por tabla o contrato. Los cambios compartidos se avisan antes a Facundo.
