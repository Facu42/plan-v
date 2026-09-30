# Apartado E: Base de datos

Registro del hilo "Base de datos y copias automáticas". El plan general está en
`docs/plan-apartados.md` (sección E).

## Cómo estaba la base el 2026-09-29

Revisado directamente en Supabase (proyecto `plan-v-app`, región Brasil):

- Plan **gratuito**. No hay copias de seguridad que se puedan usar ni restaurar, y la base
  se pausa si pasa una semana sin uso.
- Tamaño: 16 MB. 4 pacientes, 2 cuentas, 1 archivo guardado.
- Los comandos `npm run backup` y `npm run restore` son de ensayo: no leen ni escriben la
  base real (se niegan a propósito). Hoy no existe ninguna copia de la base publicada.
- Asesor de rendimiento de Supabase:
  - 7 advertencias: reglas de acceso que calculan quién es la usuaria una vez por fila.
  - 44 advertencias: tablas con dos reglas de acceso para la misma acción (una para la
    nutricionista y otra para la paciente).
  - 63 avisos: claves que apuntan a otra tabla sin índice.
  - 27 avisos: índices sin usar (normal en una base de una semana; no se tocan).

## Propuesta a Facundo (2026-09-29)

Pasar Supabase al plan **Pro, US$25 por mes** (la instancia actual entra en ese precio y el
tope de gasto viene encendido). Da copia automática diaria con 7 días guardados, la base no
se pausa, y permite encender la protección contra contraseñas filtradas. El cambio lo hace
él desde la facturación de la organización. Sin respuesta todavía.

Cuando esté en Pro: probar restaurar una copia en una base aparte y anotar el resultado acá.

## Mejora de velocidad (rama `claude/base-de-datos-copias-229zl9`)

Migración `20260929150000_performance_indexes.sql`:

- Las 7 reglas de acceso ahora calculan quién es la usuaria una sola vez por consulta. Dejan
  entrar exactamente a las mismas personas que antes.
- 63 índices nuevos, uno por cada clave sin índice.

Prueba nueva `server/db-performance.postgres.test.ts`: aplica todas las migraciones y falla
si vuelve a aparecer una clave sin índice o una regla que calcule la usuaria por fila.
Se comprobó que falla sin la migración y pasa con ella. Todas las pruebas: 895 pasan.

Las 44 advertencias de reglas dobles quedan como están, a propósito: juntarlas en una sola
regla por acción cambiaría cómo se leen los permisos de salud y con el tamaño actual no se
nota. Se revisa cuando haya muchas más pacientes.

**No aplicada en producción.** Necesita el OK escrito de Facundo. Antes de aplicarla,
confirmar con el hilo de Autenticación (apartado D) que no cambió las mismas reglas.

## 2026-09-30: plan Pro activo

- Facundo pasó la organización a Pro (comprobado: la organización figura en plan Pro).
  Las copias diarias arrancan solas en Pro; la prueba de restaurar se hace cuando exista
  la primera.
- La protección contra contraseñas filtradas sigue apagada (el asesor de seguridad lo marca).
  Se enciende desde el panel: Authentication, Attack Protection.
- Quién gastó el tráfico que frenó la organización (9,56 GB contra 5 GB gratis): el proyecto
  **ruti-chat-crm**, no Plan V. Sus consultas más repetidas se ejecutaron unos 6 millones de
  veces cada una (mensajes, conversaciones, clientes); las de Plan V, unas pocas miles.
  Dato de las estadísticas de consultas de cada base.
