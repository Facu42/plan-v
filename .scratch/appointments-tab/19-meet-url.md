# Corte 19 — `meet_url` de consultas

Estado: **completado** (2026-09-06).

## Alcance

1. El formulario de consulta acepta un enlace de videollamada opcional.
2. El contrato sólo admite URL absoluta con protocolo `https://`, máximo 500 caracteres.
3. El enlace se conserva dentro del turno como `appointment.meet_url`.
4. La tarjeta de Consultas muestra **Abrir videollamada** cuando hay URL.
5. La card de Resumen muestra:
   - enlace externo real cuando hay URL;
   - `Preparar consulta` cuando no hay URL.
6. El enlace se abre en otra pestaña con `target="_blank"` y `rel="noopener noreferrer"`.

## Seguridad

- `http://` se rechaza.
- `javascript:` se rechaza.
- Texto sin protocolo se rechaza.
- La UI no navega ni ejecuta destinos no validados por el schema.
- En modo Supabase la mutación sigue devolviendo `501` hasta el contrato `016`.

## Tests

- `server/schemas.test.ts`:
  - HTTPS válido;
  - opcional en presencial;
  - rechazo de HTTP, `javascript:`, texto plano y longitud excesiva.
- `server/appointment-flow.integration.test.ts`:
  - persistencia del enlace;
  - trimming;
  - rechazo API de URLs inseguras.

## QA en Chrome

- Guardado: `https://meet.example.com/consulta-sofia`.
- Consultas: `<a href>` real.
- Resumen: `<a href>` real, `_blank`, `noopener noreferrer`.
- Error accesible al intentar guardar `http://inseguro.example.com`.
- Al vaciar el campo, el enlace desaparece y Resumen vuelve a `Preparar consulta`.

## No incluido

- WebRTC propio.
- Creación automática de salas.
- Verificación en vivo del proveedor externo.
- Persistencia Supabase del turno o del enlace.
