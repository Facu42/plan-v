# Definición del producto Plan V (borrador para decidir, 2026-10-08)

Pedido de Facundo: empezar a tener el producto definido, dejando la app de la paciente funcional y
conectada con el panel de la nutricionista que desarrolla otro hilo. Base: `docs/mvp-v0.md`,
`docs/traspaso-estado-proyecto.md`, `docs/plan-apartados.md` y la auditoría de conexión
([auditoria-conexion-paciente-crm-2026-10-08.md](auditoria-conexion-paciente-crm-2026-10-08.md)).
Lo marcado **DECIDIR** necesita la respuesta de Facundo; hasta entonces se toma la opción recomendada.

## 1. Qué es

Plan V es el lugar donde la nutricionista acompaña a sus pacientes entre consulta y consulta.
La paciente ve su plan, registra lo que come y cómo se siente, habla con su nutricionista y paga su cuota.
La nutricionista arma planes y recetas, revisa lo que la paciente carga y decide. **Nadie diagnostica y la IA
nunca envía ni publica nada sola**: propone, la profesional revisa (`docs/limites-eticos.md`).

Dos caras y un mismo dato:

| Cara | Quién | Dónde | Dueño |
|---|---|---|---|
| App de la paciente | Paciente | `/app/*` (diseño Nutrigo, doce pantallas) | Hilo paciente |
| Panel de la nutricionista | Profesional | `/crm/*` | Hilo CRM |
| Administración | Facundo | `/admin` | Hilo CRM |
| Servidor y base | Ambos | `server/`, `supabase/` | Compartido |

## 2. Qué hace la paciente y qué ve la nutricionista

| Flujo | La paciente | La nutricionista | Estado |
|---|---|---|---|
| Alta e ingreso | Acepta invitación, completa la ficha, da consentimientos | Invita, revisa la ficha | Conectado. Falta: la profesional no puede pedir reabrir la ficha (15) |
| Plan y recetas | Ve el plan publicado, recetas asignadas, compras | Arma borrador, revisa, publica; asigna recetas | Conectado. **Falta el control de alergias al asignar por día (1)**; plan trabado por meta vieja (7) |
| Metas | Ve macros contra la meta publicada | Fija y publica la meta | Conectado. Objetivo/estado/avance no llegan a la paciente (11) |
| Comidas | Registra con foto o texto (IA opcional) | Revisa y confirma | Conectado. La paciente no puede corregir (16) |
| Agua, descanso, pasos | Los carga cada día | Los ve en progreso | **El día se corta mal entre 21 y 24 h (2)**; pasos no se ven (19) |
| Peso y medidas | Con permiso, las carga | Las ve en progreso | **Retirar el permiso no oculta lo cargado (5)** |
| Fotos y estudios | Privados, con permiso | Los abre con enlace de 60 s | Conectado |
| Ejercicio | Registra actividad | Asigna rutina | Parcial: avance y calorías quemadas en 0 (19) |
| Mensajes | Chat con adjuntos | Responde | Conectado. Sin actualización en vivo (9); no leídos del panel mal contados (8); límite de 50 (20) |
| Turnos | Confirma o pide cambio | Crea, reprograma, cancela | **El turno desaparece al empezar (3)**; editar borra la confirmación (14) |
| Avisos | Hoy no recibe | — | **Falta (10)** |
| Cuota y pagos | Ve el aviso y avisa que pagó | Fija cuota, confirma el pago | Conectado. Banner no sale en celular; cuota extra al cambiar vencimiento (13) |
| Seguimiento | — | Adherencia, alertas, «Marcar revisado» | **Adherencia siempre 0% en producción (4)** |
| Recursos | Lee y guarda | Redacta y asigna | Conectado. Sin aviso al asignar; sin despublicar (21) |
| Fotos de platos | Ve la foto del plato | Se generan al publicar | Conectado. Modelo gratuito con resultados irregulares |

## 3. Reglas del producto (ya vigentes, se mantienen)

1. Diseño exacto al archivo de Nutrigo (Figma `OTolnKfsxUFjaZOhhdb04i`); escritorio 1440 y móvil 390.
2. Todo día y hora en `America/Argentina/Buenos_Aires`, también en el servidor.
3. La paciente solo ve lo publicado; los borradores y notas privadas nunca le llegan.
4. Cada dato sensible exige consentimiento vigente; retirarlo corta el acceso, también a lo ya cargado.
5. La IA propone; la profesional revisa y publica. Sin cobro automático.
6. Una rama y un PR por tema; nada directo a `main`; nada en la base de producción sin la frase escrita de Facundo.

## 4. Cómo trabajan juntos los dos hilos

- **Hilo CRM** (otro agente): `/crm`, `/admin`, recetas, planes, modelos, alimentos, biblioteca.
- **Hilo paciente** (este): `/app`, todo lo que la paciente carga y ve, y las rutas del servidor que le sirven.
- **Servidor y base**: cualquiera puede tocarlos, con estas reglas: (a) no tocar los archivos del otro hilo sin avisar a
  Facundo; (b) una migración nueva nunca edita una vieja y se anuncia en el PR; (c) cada tabla tiene un solo dueño.
- Hallazgos que pertenecen al otro hilo se dejan escritos (esta auditoría) y Facundo los pasa; no se arreglan en
  silencio para evitar choques.
- Hallazgo **1 (alergias)** es de seguridad clínica y cae en el territorio del hilo CRM: se recomienda avisarle antes
  de cualquier otro arreglo.

## 5. DECIDIR (con la opción recomendada)

| # | Pregunta | Recomendación |
|---|---|---|
| D1 | ¿El objetivo, su estado y su avance los ve la paciente? | Sí, el objetivo y el estado; el avance manual con nota. Persistirlos en la base. |
| D2 | Paciente con cuota impaga o pendiente: ¿ve el plan completo o solo la pantalla de pago y los mensajes (como dice `mvp-v0.md`)? | Que la deuda de cuota no bloquee (lo que dice `cobros-y-panel.md`); bloquear solo si la profesional corta el acceso. |
| D3 | ¿Cómo se entera la paciente de turno nuevo, recurso asignado o plan nuevo? | Aviso dentro de la app (campana) y correo; sin WhatsApp por ahora. |
| D4 | ¿La paciente puede corregir o borrar una comida o medida propia? | Sí, mientras no esté revisada; después, pedir corrección. |
| D5 | ¿Cargar una comida exige permiso de IA? | No: el diario de texto va sin IA; la IA solo con permiso. |
| D6 | Paciente archivada que escribe | Avisar a la paciente que su cuenta está archivada y bloquear el envío. |
| D7 | Publicar un plan nuevo: ¿archiva el anterior entero? | Que la versión nueva muestre qué cambia y avise a la paciente; mantener lo anterior hasta que la nueva empiece. |
| D8 | Fotos de ingredientes en la app | Desarrollo futuro (decidido el 2026-10-08). |
| D9 | Foto de plato con el modelo gratuito | Dejar el modelo actual; revisar el modelo más adelante (decidido el 2026-10-08). |

## 6. Orden de trabajo propuesto

1. **Datos correctos (solo código)**: día en hora de Argentina en el servidor; aviso «hoy» consistente. Con prueba en zona UTC.
2. **Seguridad clínica y privacidad (migraciones, con frase de Facundo)**: alergias al asignar por día (hilo CRM),
   medidas con permiso retirado, permisos sobrantes en `patients`.
3. **Turnos y avisos**: que el turno siga visible durante la consulta, que editar no borre la confirmación, y avisos a la paciente.
4. **Seguimiento real**: adherencia calculada en producción, pasos visibles, actividad y calorías.
5. **Que se sienta vivo**: actualización de mensajes y turnos sin recargar, no leídos correctos, paginación del chat.
6. **Decisiones D1–D7** hechas funcionalidad (objetivo visible, corregir registros, plan nuevo con aviso).
7. **Cobertura**: un recorrido en navegador por cada fila corregida.

Cada paso es una rama y un PR; los que tocan la base esperan la frase de Facundo.
