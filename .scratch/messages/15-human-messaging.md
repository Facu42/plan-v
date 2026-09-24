# Corte 15 — Mensajería humana paciente–nutricionista

Estado: **completado** (2026-09-06).

## Alcance

1. La paciente puede escribir y enviar mensajes a Verónica desde `Mensajes`.
2. El thread se ordena cronológicamente, excluye cualquier elemento sin `sent_at` y no muta el estado original.
3. Cada burbuja muestra autor (`Verónica` / `Vos`) y fecha u hora local.
4. El composer tiene label accesible, límite de 2000 caracteres, estado de envío y error recuperable.
5. La tarjeta existente `Ficha breve` del CRM incorpora:
   - los últimos tres mensajes enviados;
   - autor y fecha;
   - un composer para que Verónica escriba mensajes propios.
6. No se agregó una card nueva al dashboard.
7. Los mensajes enviados se refrescan en el store y permanecen al recargar mientras el servidor demo siga activo.

## Seguridad y privacidad

- Una respuesta del endpoint originada por paciente usa `toPatientSelfView`: no incluye `brief`, `adherence_why`, `note_for_nutri` ni `suggested_by_ai`.
- En memoria/demo, `suggested_by_ai` sólo puede conservarse cuando `from === 'vero'`; una paciente no puede marcar su mensaje como sugerido por IA.
- Un paciente inexistente devuelve `404`; texto vacío devuelve `400`.
- En Supabase, la dirección del mensaje se deriva del rol de `profiles` del `author_id`. Ya no se compara incorrectamente `author_id` con `patient_id`.
- Autores Supabase sin rol válido se descartan de forma fail-closed.
- La autorización productiva continúa derivando el actor autenticado y su relación con el paciente; el `from` del cliente no decide la autoría real.

## TDD

- `server/message-flow.integration.test.ts`: respuesta segura, flag IA profesional, `400` y `404`.
- `server/db/supabase-repo.test.ts`: mapeo `paciente`/`nutri` y rechazo de rol desconocido.
- `src/components/shared/message-thread.test.ts`: orden ascendente, filtrado de borradores y no mutación.

## QA en Chrome real

Chrome headless aislado, zona `America/Argentina/Buenos_Aires`, modo memoria/demo:

1. Sofía envió: `Hola Verónica, ¿podemos revisar la merienda de mañana?`.
2. Se renderizó como `Vos`, con hora, input vacío y sin texto privado del copiloto.
3. CRM mostró el mensaje en `Ficha breve → Mensajes recientes`.
4. Verónica respondió: `Sí, mañana te propongo una opción simple para la merienda.`.
5. CRM confirmó `Mensaje enviado.` y limpió el textarea.
6. Paciente mostró tres mensajes en orden Verónica → Sofía → Verónica.
7. El thread se conservó tras recargar la aplicación.
8. Sin overflow; composer dentro del viewport en 320, 390, 768, 1024 y 1440 px.
9. Chrome aislado finalizado y puerto 9224 liberado.

## No incluido

- IA respondiendo a la paciente.
- Envío automático de borradores.
- WhatsApp, email o push.
- Adjuntos y mensajes masivos.
- Aplicación del SQL draft o migración Supabase sin contrato `016` revisado.
