# 46 — Consultas profesionales en el diseño Nutrigo

## Implementado

- `ShowroomConsultations` reemplaza el puente legacy de **Gestionar consultas** desde Dashboard y Ficha.
- Selector multipaciente con reinicio seguro del formulario al cambiar de persona.
- Tres indicadores derivados: estado, modalidad y duración.
- Calendario mensual con 35/42 celdas y una única próxima ocurrencia derivada del día/hora almacenados; no se presenta como historial.
- Detalle lateral en escritorio y apilado en tablet/móvil, siguiendo Calendar de Nutrigo.
- Agendar, reagendar y cancelar con confirmación mediante el endpoint existente.
- Enlaces externos se renderizan solo si son HTTPS y conservan `noopener noreferrer`.
- La vista Paciente permanece separada y sin controles profesionales.
- **Fichas** continúa marcado como módulo activo y la superficie profesional usa ancho completo sin rail global duplicado.

## Geometría de referencia

Fuente local: frames `84:1666` (1440), `427:15467` (800) y `433:17250` (390).

- Escritorio: columnas internas verificadas de 833 + 285 px, gap 28 px.
- Tres tarjetas de resumen de 108 px en escritorio/tablet y 178 px en móvil.
- Encabezado semanal de 40 px y celdas mensuales de 120 px; móvil usa encabezado de 36 px.
- En tablet el detalle pasa debajo; en móvil se apila a ancho completo.
- Sin overflow horizontal del documento en 1440/800/390.

## Verificación

- RED inicial: `ShowroomConsultations` no existía. GREEN: cinco pruebas nuevas para parseo, próxima fecha, calendario, detalle seguro, vacío y ausencia de estados inventados.
- Browser sobre API/frontend aislados `3011/5181`: cinco flujos — entrada Nutrigo, reagendado aislado, cambio/restauración, cancelación confirmada y vista Paciente de solo lectura.
- El turno original de `pat-sofia` se restauró y el segundo paciente permaneció intacto. Los eventos QA quedaron únicamente en el proceso aislado, luego eliminado.
- Seis vistas: claro/oscuro × 1440/800/390; captura móvil completa adicional para verificar el detalle bajo el calendario.
- Suite completa: 259 pruebas / 48 archivos (110 suites); TypeScript frontend/server, build 121 módulos, `npm audit` 0 vulnerabilidades, firmas 91/attestations 46 y `git diff --check` aprobados.

## No incluido

- No es la Agenda multipaciente completa: faltan orden cronológico canónico, vistas día/semana/mes navegables, conflictos y múltiples citas.
- No se agregó historial, confirmación por paciente ni notas de preparación porque el modelo/API todavía no los soporta.
- Objetivos conserva temporalmente el editor anterior.
- Contrato 016, Supabase/RLS, producción y aprobación visual global permanecen pendientes.
