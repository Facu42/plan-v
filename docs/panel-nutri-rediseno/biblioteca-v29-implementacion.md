# Biblioteca v29: implementación

Autorizada por Facundo el 25/10: «APROBADO PARA IMPLEMENTAR YA».
Rama: `codex/biblioteca-v29`. Fuente: `design/panel-nutri/v29/panel-trabajo.html`, función `sxBiblioteca`.

- [x] Copiar tarjetas y columna «Quién lo abrió», sin alterar el armazón ni Recetas.
- [x] Conectar catálogo y lectura; alta de tres campos y asignación. Retirar versiones y publicación manual de esta pantalla.
- [x] Avisar mediante mensajes de la app a pacientes asignadas; conservar errores y evitar reenvíos al reintentar.
- [x] Verificar contratos, pruebas, compilación, tipos, revisión y capturas en ambos temas y tamaños.
- [x] Registrar entrega e [informe del paso 10](biblioteca-v29-verificacion.md). Sin migraciones ni cambios en producción.

Flujos críticos: acceso y aislamiento (pruebas existentes de servidor), catálogo y publicación (`server/resources/flow.integration.test.ts`), asignación sin duplicados y lectura (`server/resource-assignment-flow.integration.test.ts`), recetas (sin cambios), Biblioteca con borradores, errores y selección (pruebas nuevas).

## Corrección solicitada por Facundo (25/10)

La continuación anterior no cerraba los seis gaps. Esta corrección modifica código de la app:

1. `PanelBiblioteca.tsx` y `NutrigoShowroom.tsx`: textos de Recetas en Biblioteca; enlace `/crm/biblioteca?biblioteca=recetas` conservado.
2. `biblioteca-model.ts`: tipos Guía/Video/PDF mapeados a `guia`/`video`/`pdf`. Las categorías temáticas previas se muestran como Guía. Tarjeta y detalle muestran el tipo, sin estados editoriales.
3. `PanelBiblioteca.tsx`: Nuevo recurso con Título, Tipo y De qué se trata. Guardar usa las API existentes de guardado y publicación para que el recurso pueda asignarse inmediatamente. La descripción se conserva como resumen y sección legible. No monta `ProfessionalResourceEditor` ni presenta controles de versiones o publicación.
4. Asignar muestra el título del recurso y las ya asignadas marcadas. Cada paciente nueva tiene su propia llamada a `api.assignResource`; así una asignación concurrente existente no silencia el push de otra nueva. Los errores parciales conservan solo las pendientes.
5. Retirado Ver contenido y su panel editorial.
6. Avisar por la app envía directamente a las ya asignadas, con título y ruta al recurso. Sin asignadas informa «Primero asignalo a alguien.». Reintenta fallidas con el mismo `client_id`.

Video/PDF son tipos guardados en `category`; este alcance de tres campos no incorpora carga de archivos. El guardado conserva el id si falla la publicación, para reintentar sin duplicados. La API general y el editor usado fuera de Biblioteca no se modifican.

Pruebas específicas: `biblioteca-model.test.ts`, `server/resources/assignment-push.routes.test.ts` y `e2e/biblioteca.spec.ts`. [Informe actual y paso 10](biblioteca-v29-verificacion.md).
