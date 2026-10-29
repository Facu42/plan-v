# Ajustes · boceto v29

Armado con el código del boceto (`ajV0` a `ajV4` de `design/panel-nutri/v29/panel-trabajo.html`, mismas clases y orden): Mi cuenta, Plantillas, Avisos automáticos, Seguridad e Integraciones. Archivos: `PanelAjustes.tsx` (pestañas, carga de la marca y diálogos), `PanelAjustesVistas.tsx` (las cinco vistas), `ficha-ajustes.ts` (textos fijos del boceto y cálculos chicos), `AjustesAccount.tsx` (hooks de avisos y dos pasos) y `ajustes-v29.css` (solo acomoda las vistas en la pantalla; el diseño sale de `panel-v29.css`).

## Qué es real
- **Datos del consultorio, Título y matrícula, Firma y marca:** cada «Editar» / «Cambiar» abre su cajón (mismos campos que `AJA` del boceto: nombre, matrícula, CUIT, dirección, teléfono, mail; título, matrícula nacional y provincial, especialidad; firma y logo en PNG o JPG de hasta 500 KB). Se guardan en la marca (`nutrition_settings`) y «contacto» se mantiene al día para los PDF. Sin firma, el certificado dibuja la firma de ejemplo del boceto.
- **Plantillas:** lista por Formularios y Certificados, vista del formulario (preguntas) o del certificado (membrete con tus datos, firma, variables resaltadas), «Nueva», «Editar» (nombre, preguntas o texto; también «Eliminar plantilla»), «Cuándo se usa» y «Vista de la paciente». Se guardan en `nutrition_templates` (hasta 100 por profesional).
- **Avisos automáticos:** cada interruptor y su «Cuándo» y mensaje se guardan en `notice_settings`; los tres de «Reglas de regreso» también. El texto «Así le llega» sale del mensaje guardado.
- **Apariencia:** «Tema oscuro» (se guarda en la cuenta), «Letra más grande» (la regla `.app.ajbig .main` del boceto) y «Menos movimiento» (corta transiciones y animaciones). Las dos últimas se guardan en este dispositivo y se aplican al abrir el panel.
- **Avisos para vos:** los tres canales reales (app, mail, push) con las preferencias de la profesional.
- **Tus datos → Descargar:** abre los reportes y la descarga de indicadores que ya existían.
- **Obras sociales y reservas:** «Ir a Página pública» lleva a la página pública.
- **Seguridad:** el estado de los dos pasos sale de Supabase (el interruptor abre su configuración); «Cambiar clave» manda el enlace de recuperación al mail; «Cerrar las demás» cierra las otras sesiones. «Copias de seguridad»: todos los días, 7 días (plan Pro de Supabase); «Última» queda en «Sin dato» porque no hay forma de leerla desde la app.
- **Integraciones:** Google y Mercado Pago se conectan y desconectan de verdad; Balanzas explica cómo importar un informe.

## Qué necesita la base (migración `20261028220000_ajustes_config.sql`, sin aplicar hasta la frase de Facundo)
Amplía `private.valid_nutrition_settings` (cuit, address, phone, email, degree, license, province_license, specialty, signature) y crea `nutrition_templates` y `notice_settings` con RLS por `my_nutritionist_id()`. Hasta que se aplique, guardar plantillas, avisos y los datos nuevos de la marca falla con un mensaje claro y todo lo demás sigue igual. Es aditiva: sin DROP.

## Defaults elegidos (el archivo dibuja algo que la app no tiene)
- Bloques sin dato muestran «Sin completar», «—», «Sin dato» o un texto corto; no hay datos de ejemplo (ni MN 4521, ni «Fundadora», ni 48 pacientes, ni «88 % a tiempo»).
- Siguen sin función, con su razón o un texto corto: plan de Plan V, pagos y factura, obras sociales y planilla (dependen de Página pública, otro hilo), «Dos pasos obligatoria para el equipo», uso y últimas respuestas de cada plantilla, «Últimos enviados», historial de ingresos, registro de accesos y consentimientos (no hay dónde se registren para sumarlos) y la lista de sesiones.
- Prender un aviso guarda la elección; el envío automático de cada uno se conecta aparte (el mail espera la clave de Brevo). La pantalla lo dice en una nota corta que el boceto no trae.
- «Firma»: el boceto ofrece «Dibujarla» o «Subir una foto»; sólo está la foto. «Color de los informes» del boceto no se desarrolló.
- «Brevo / Conectar» abre un cartel que explica que se conecta al final, con la clave cargada por nosotros.
- En Avisos automáticos, «Integraciones» del cuadro del mail es un enlace a la pestaña (el boceto lo tiene como texto).

## Revisión contra el código del boceto
Árbol del boceto vs. app en las cinco vistas, elemento por elemento (clase, orden y medidas) con datos cargados en la app: Mi cuenta, Integraciones y Seguridad tienen las mismas clases; Plantillas y Avisos también (lista `ajtps`/`ajtp` con su `em.num`, `ajq`/`ajcert`/`ajch`/`ajcf`, `ajav`, `ajmsg`). Diferencias que quedan: la nota de envío bajo «Así le llega» (agregada a propósito) y los textos de ejemplo del boceto. Se corrigió: letra fina de los números de «Uso», el encabezado sin salto de línea y dos campos por fila en los cajones.

## Informe Regression Guard (paso 10)
- Flujos: editar los tres bloques de la marca (con firma y logo), crear, editar y eliminar plantillas, prender y editar avisos, letra grande y menos movimiento, cambiar el tema, preferencias de aviso, descargar indicadores, conectar y desconectar Google y Mercado Pago, pedir el enlace de clave, cerrar otras sesiones, ver dos pasos.
- Regresiones: la marca sólo suma campos opcionales (los PDF siguen leyendo `contact` y `license`); el diálogo viejo «Marca y referencias» sigue guardando sin perderlos. `PanelAjustes` ya no recibe `appearance` sino `tema`.
- Contratos: rutas nuevas `GET/PUT /api/ajustes/templates`, `DELETE /api/ajustes/templates/:id`, `GET/PUT /api/ajustes/notices` (sólo nutricionista, demo en memoria). Áreas frágiles: `valid_nutrition_settings` (cambia con la migración, que sólo permite claves nuevas).
- Migraciones: 1 aditiva sin aplicar (espera la frase de Facundo; base primero, main después). Automatizaciones: ninguna todavía (los avisos sólo guardan la elección). Fire test: no aplica.
- Tests: `ficha-ajustes.test.ts`, `server/ajustes/routes.test.ts` (4) y tres en `equipo-ajustes.test.tsx`; recorrido real en el navegador con el servidor local.
- Veredicto: listo para ok visual; guardar plantillas, avisos y datos nuevos en producción espera la migración.
