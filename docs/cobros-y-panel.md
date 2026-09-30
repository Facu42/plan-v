# Cobros, deudas y panel del servicio

Registro del apartado de cobros. Empezó el 30/09/2026 con el pedido de Facundo: él vende Plan V a
nutricionistas, ellas se vinculan con sus pacientes y les cobran cuotas.

## Cómo está hoy la app

- **Paciente:** la nutricionista marca a mano el estado de cada paciente (Pendiente, Activo hasta
  una fecha, Exceptuado, Vencido). Si no está Activo o Exceptuado, la paciente no ve nada de la app:
  solo una pantalla de "renová tu acompañamiento", con el nombre de Verónica fijo.
- **No se guarda** cuánto cuesta la cuota, cuándo pagó, cuánto debe ni por qué medio.
- **Nutricionista:** la base ya tiene un lugar para la suscripción de cada consultorio (en prueba,
  activa, vencida, cancelada, sin cargo), pero hoy la puede cambiar la propia nutricionista
  (se puede poner "sin cargo" sola; lo anotó Seguridad). No existe un usuario administrador para
  Facundo ni un panel suyo.
- No hay Mercado Pago conectado ni ningún cobro real.

## Propuesta

Tres partes, en este orden.

### 1. Cuotas y deudas de pacientes (no depende de ninguna decisión)

Para la nutricionista, un apartado **Cobranzas**:
- Cuota por paciente (monto en pesos y día de vencimiento), con un valor por defecto del consultorio.
- Registrar un pago en dos toques: monto, fecha, medio (efectivo, transferencia, Mercado Pago, otro)
  y nota. El sistema calcula solo si está al día, por vencer o en deuda, y cuánto debe.
- Tablero: cobrado este mes, pendiente, lista de quién debe y desde cuándo, y un botón para
  mandarle el recordatorio por WhatsApp con el alias o link de pago de la nutricionista.
- La deuda también se ve en la lista de pacientes y en la ficha.

Para la paciente:
- Un aviso de "tenés una cuota pendiente" con el monto, los datos de pago de su nutricionista
  (alias, CBU o link de Mercado Pago que ella cargue) y el historial de lo que pagó.
- Botón "Ya pagué" que le avisa a la nutricionista para que confirme.
- Cambio de criterio propuesto: la deuda **no bloquea** el plan por defecto. Es su información de
  salud; la nutricionista decide si pausa el acceso de esa paciente. El nombre de Verónica deja
  de estar fijo.

La plata va directo de la paciente a la nutricionista; Plan V solo lleva la cuenta. Así no
intermediamos dinero (sin comisiones, sin temas impositivos para Facundo).

### 2. Panel de Facundo (administrador del servicio)

- Un rol de administrador que solo tiene su cuenta, fuera del alcance de las nutricionistas.
- Lista de nutricionistas: estado (en prueba, activa, vencida, suspendida, sin cargo), fecha de
  vencimiento, cantidad de pacientes, último ingreso.
- Acciones: registrar un pago, extender la prueba, dar "sin cargo", suspender. Cada cambio queda
  anotado con fecha.
- Números del negocio: nutricionistas activas, en prueba, vencidas, ingreso del mes.
- Se cierra el agujero actual: solo el administrador cambia la suscripción de un consultorio.

El panel **no** muestra datos de salud de las pacientes (solo cantidades), por privacidad.

### 3. Cobro a nutricionistas

- Alta propia → prueba gratis → aviso antes del vencimiento → si no paga, unos días de gracia y
  después el consultorio queda **solo lectura** (ve todo, no puede cargar nada nuevo). Nunca se
  borran datos ni se les corta el acceso a las pacientes de golpe.
- Primero con pago manual (transferencia o link de Mercado Pago) que Facundo marca en su panel.
- Después, débito automático mensual con suscripciones de Mercado Pago, cuando haya precio fijo y
  las primeras clientas. Necesita su cuenta de Mercado Pago y su OK antes de cualquier cobro real.

## Qué depende de Facundo

- Cómo le pagan las nutricionistas al principio (manual o Mercado Pago automático).
- Precio mensual y días de prueba gratis. Mientras tanto se deja una prueba de 30 días, editable
  desde su panel.
- Nada se aplica en la base de producción sin su OK escrito.

## Avance

- 30/09/2026: relevado lo que existe y enviada la propuesta.
