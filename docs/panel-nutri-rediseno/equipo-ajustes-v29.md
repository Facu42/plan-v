# Equipo y Ajustes v29

[PR #192 en borrador](https://github.com/Facu42/plan-v/pull/192). Código `0649e18`. Rama `cursor/equipo-ajustes-v29-70bc`, desde el avance de Codex en `work/equipo-ajustes-v29` (`4e52a34`) sobre main `62a8e48` (#191). **Sin merge, sin publicación y sin migraciones.**

Equipo y Ajustes usan el armazón que ya está en main, la letra Inter y los temas claro y oscuro. El menú dice Ajustes, no Configuración. Siguen andando `/crm/equipo`, `/crm/ajustes` y los enlaces anteriores `?modulo=equipo` y `?modulo=configuracion`.

## Qué se ve

Equipo: título con la cantidad real de personas, pestañas Integrantes, Permisos y Registro de accesos, e Invitar a alguien. La tabla muestra persona, rol, pacientes que ve, último ingreso, dos pasos y estado. En el escritorio las seis columnas entran en la tarjeta. En el celular la tabla se desplaza para el costado, sin agrandar la página.

Los integrantes salen de los consultorios, la recepción y las profesionales que ya devuelve la API. Último ingreso y dos pasos dicen «Sin información»: esa API no los trae. Invitar a recepción prepara el código real y aclara que no se manda un mail. Invitar a una nutricionista usa la invitación por correo que ya existía. Contador no se puede invitar. Quitar el acceso de recepción usa la revocación que ya existía. Pausar, reenviar y cerrar sesiones no se simulan.

Ajustes: cinco pestañas (Mi cuenta, Plantillas, Avisos automáticos, Seguridad e Integraciones). Mi cuenta muestra el nombre y el contacto reales del consultorio, el tema y los avisos de la profesional. Google Calendar y Mercado Pago muestran el estado real de la conexión. No hay plan «Fundadora», ni «48 pacientes», ni cifras del boceto.

## Qué queda vacío o en «Próximamente»

- Permisos por módulo y registro de accesos (fichas, cambios e ingresos). Es el paquete C. La matriz se ve deshabilitada y no guarda nada.
- Actividad del equipo, sesiones, historial de ingresos y respaldos.
- Plantillas y certificados. No hay tablas ni alta.
- Avisos automáticos por evento y reglas de regreso. Las preferencias de la profesional sí se guardan.
- Mail con Brevo. El texto dice que se activa cuando se conecte; la conexión no está.
- Firma dibujada, título y matrícula editables desde Ajustes, y la exportación completa de fichas.
- Dos pasos del equipo. El estado de la cuenta se consulta; en el demo dice que no está disponible. No se prende ni se apaga desde esta pantalla.

## Evidencia

- [Capturas 1440 y 390, claro y oscuro](../screenshots/equipo-ajustes/): Integrantes, Permisos, Mi cuenta y Seguridad.
- Suite con Node 22 y `npm test -- --maxWorkers=2`: **3.403 aprobadas y dos omitidas, 541 archivos** (183 s).
- Tipos (`npm run check`), compilación, secretos y `panel:v29:check` en verde. La compilación conserva el aviso de bundles grandes.
- `panel:contrato:v29`: **en verde**, claro y oscuro, para armazón, Seguimiento, Progreso, Asistente, Alimentos, Biblioteca y Planes. Ese contrato no mide Equipo ni Ajustes. Esas dos pantallas las cubre el recorrido de abajo.
- Recorrido de punta a punta del slice: **4 aprobados** (25 s). Pestañas, invitación con código y con error, vacío sin consultorio, recepción que no consulta organizaciones, alias de Configuración, preferencias reales, enlaces, Inter, y sin desborde a 1440 y 390 en claro y oscuro.
- Prueba de fuego: sacar una letra del encabezado «Dos pasos» hizo fallar la prueba de Equipo. Se restauró el texto y la prueba volvió a verde.

## Regression Guard · paso 10

- **Flujos críticos:** menú Equipo/Ajustes y enlaces anteriores, pestañas, invitación de recepción (éxito y error), preferencias de avisos de la profesional, tema claro/oscuro y anchos 1440/390 cubiertos. ✅ La revocación de recepción reutiliza la API que ya existía; este slice no le agrega un recorrido propio. ⚠️
- **Regresiones cubiertas:** el menú plegado nombra Ajustes y Equipo. Equipo ya no aparece como pantalla pendiente. Las columnas Dos pasos y Estado no se pueden sacar sin que falle la prueba.
- **Contratos:** rutas permitidas solo para la profesional, selección del menú con el alias `configuracion`, invitación `POST` de recepción e invitación profesional por correo, preferencias `audience=pro`, marca nutricional y conexiones de agenda. Sin campos nuevos ni cambio de esquema.
- **Áreas frágiles:** el encabezado del armazón comparte las pestañas. Un cambio ahí se nota en el título o en el botón Invitar. Las invitaciones dependen de que la cuenta sea dueña del consultorio; si no lo es, el botón queda deshabilitado y se dice por qué.
- **Migraciones:** no hay. No se tocó la base de producción.
- **Fire test:** detectado y restaurado. ✅
- **Automatizaciones:** el recorrido regenera las 16 capturas y comprueba Inter, el ancho de la página y que no se inventen personas antes de cargar. No hace falta una variable nueva ni un paso manual de publicación.
- **Veredicto: HOLD** hasta el ok visual de Facundo. El PR queda en borrador.
