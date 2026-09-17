# Corte 17 — Alta de paciente desde CRM

Estado: **completado** (2026-09-06).

## Alcance

1. El botón existente **Nuevo paciente** abre un modal accesible dentro del Centro profesional.
2. El alta solicita:
   - nombre completo;
   - email de invitación;
   - objetivo declarado.
3. La ficha nueva nace con:
   - etapa `ingreso`;
   - estado visual `Ingreso`;
   - cobranza `pending`;
   - adherencia `0`;
   - menús, comidas, hábitos, mensajes y consultas vacíos.
4. Al completar el alta:
   - la paciente aparece en `Mi seguimiento`;
   - el contador del menú se actualiza;
   - la ficha nueva queda seleccionada;
   - se informa que la invitación fue guardada pero no enviada.

## Contrato de invitación

- El email se normaliza a minúsculas.
- El destino se guarda separado de la ficha de salud como `PatientInvite`.
- Estado disponible en demo: `not_sent`.
- El email no se agrega al objeto `Patient` ni aparece en la ficha clínica.
- Una segunda invitación al mismo email devuelve `409`.

## Seguridad

- `canManagePatients(actor, 'create_patient')` autoriza exclusivamente al rol `nutri`.
- En modo Supabase la ruta exige un actor profesional válido y devuelve `501` porque el flujo Auth/invite depende del contrato `016` todavía ausente.
- No se escribe en memoria cuando Supabase está habilitado.
- No se aplicaron migraciones ni se modificó SQL.

## Validación

`patientCreateInputSchema`:

- nombre: 2–80 caracteres;
- email válido: máximo 254 caracteres;
- objetivo declarado: 2–240 caracteres;
- los tres campos se recortan; el email se normaliza.

Errores:

- input inválido: `400 Datos inválidos`;
- email duplicado: `409 Ya existe una invitación para ese email`;
- contrato Supabase ausente: `501`.

## Tests

- `server/patient-onboarding.integration.test.ts`:
  - alta completa;
  - defaults seguros;
  - separación del email;
  - persistencia en la lista demo;
  - validación y duplicados.
- `server/schemas.test.ts`: normalización y límites.
- `server/security/contracts.test.ts`: rol profesional requerido.

## QA en Chrome

Flujo validado con `Ana QA`:

1. abrir **Nuevo paciente**;
2. cargar nombre, email y objetivo;
3. crear alta;
4. comprobar selección automática y chip `Pendiente`;
5. comprobar contador de pacientes `4`;
6. comprobar que el email no aparece en la ficha;
7. recargar, volver al Centro profesional y comprobar que la paciente sigue en la lista mientras el servidor demo permanece activo.

Responsive del modal sin overflow interno ni fuera del viewport:

- 320 px;
- 390 px;
- 768 px;
- 1024 px;
- 1440 px.

## No incluido

- envío real de email;
- usuario Supabase/Auth para la paciente;
- aceptación de invitación;
- enlace real de pago;
- Mercado Pago;
- persistencia después de reiniciar el servidor demo;
- migración o RLS `016`.
