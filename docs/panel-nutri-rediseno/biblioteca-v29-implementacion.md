# Biblioteca v29: implementación

Autorizada por Facundo el 25/10: «APROBADO PARA IMPLEMENTAR YA».
Rama: `codex/biblioteca-v29`. Fuente: `design/panel-nutri/v29/panel-trabajo.html`, función `sxBiblioteca`.

- [x] Copiar tarjetas y columna «Quién lo abrió», sin alterar el armazón ni Recetas.
- [x] Conectar catálogo, lectura, creación, versiones, publicación y asignación existentes.
- [x] Avisar mediante mensajes de la app a pacientes asignadas; conservar errores y evitar reenvíos al reintentar.
- [x] Verificar contratos, pruebas, compilación, tipos, revisión y capturas en ambos temas y tamaños.
- [x] Registrar entrega e [informe del paso 10](biblioteca-v29-verificacion.md). Sin migraciones ni cambios en producción.

Flujos críticos: acceso y aislamiento (pruebas existentes de servidor), catálogo y publicación (`server/resources/flow.integration.test.ts`), asignación sin duplicados y lectura (`server/resource-assignment-flow.integration.test.ts`), recetas (sin cambios), Biblioteca con borradores, errores y selección (pruebas nuevas).

Los recursos actuales contienen texto por secciones. Video y PDF adjuntos no tienen contrato de creación en esta API: se informa su disponibilidad pendiente, sin simular archivos guardados.
