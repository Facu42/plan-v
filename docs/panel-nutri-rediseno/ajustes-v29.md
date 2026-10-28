# Ajustes · boceto v29

Armado con el código del boceto (`ajV0` a `ajV4` de `design/panel-nutri/v29/panel-trabajo.html`, mismas clases y orden): Mi cuenta, Plantillas, Avisos automáticos, Seguridad e Integraciones. Archivos: `PanelAjustes.tsx` (pestañas, carga de la marca y diálogos), `PanelAjustesVistas.tsx` (las cinco vistas), `ficha-ajustes.ts` (textos fijos del boceto y cálculos chicos), `AjustesAccount.tsx` (hooks de avisos y dos pasos) y `ajustes-v29.css` (solo acomoda las vistas en la pantalla; el diseño sale de `panel-v29.css`).

## Qué es real
- **Datos del consultorio / Firma y marca:** nombre, contacto (a Mail si trae arroba, si no a Teléfono) y logo salen de la marca guardada; «Editar» y «Cambiar» abren la edición de marca de siempre.
- **Apariencia:** «Tema oscuro» es un interruptor real (oscuro ⇄ claro, se guarda en la cuenta). «Sistema» ya no se elige desde acá.
- **Avisos para vos:** los tres canales reales (app, mail, push) con las preferencias de la profesional.
- **Tus datos → Descargar:** abre los reportes y la descarga de indicadores que ya existían.
- **Obras sociales y reservas:** «Ir a Página pública» lleva a la página pública.
- **Seguridad:** el estado de los dos pasos sale de Supabase (el interruptor abre su configuración); «Cambiar clave» manda el enlace de recuperación al mail; «Cerrar las demás» cierra las otras sesiones.
- **Integraciones:** Google y Mercado Pago se conectan y desconectan de verdad; Balanzas explica cómo importar un informe.

## Defaults elegidos (el archivo dibuja algo que la app no tiene)
- Bloques sin dato muestran «Sin completar», «—», «Sin dato» o un texto corto; no hay datos de ejemplo (ni MN 4521, ni «Fundadora», ni 48 pacientes).
- Matrícula, CUIT, dirección, título y especialidad, plan de Plan V, pagos y factura, obras sociales y planilla, letra grande y menos movimiento, plantillas, avisos automáticos y reglas de regreso, equipo obligatorio con dos pasos, copias de seguridad, consentimientos, historial de ingresos y registro de accesos todavía no tienen dónde guardarse: quedan deshabilitados con su razón o con un texto corto.
- Los ocho avisos del boceto se listan con su «cuándo» y un texto sugerido («Mensaje sugerido», no «Así le llega», porque todavía no se mandan desde acá).
- «Brevo / Conectar» abre un cartel que explica que se conecta al final, con la clave cargada por nosotros.
- Sesiones abiertas solo muestra «Este dispositivo»; no se puede listar el resto.
- En Avisos automáticos, «Integraciones» del cuadro del mail es un enlace a la pestaña (el boceto lo tiene como texto).

## Revisión contra el código del boceto
Árbol del boceto vs. app en las cinco vistas, elemento por elemento (clase, orden y medidas): Mi cuenta e Integraciones tienen las mismas clases; Plantillas, Avisos y Seguridad difieren solo donde el boceto trae datos de ejemplo (lista de plantillas, preguntas, líneas de tiempo, sesiones y consentimientos) y la app muestra un texto corto. Se corrigió: el encabezado de los bloques no salta de línea (como en el boceto) y los títulos de grupo de las plantillas.

## Informe Regression Guard (paso 10)
- Flujos: editar la marca, cambiar el tema, preferencias de aviso, descargar indicadores, conectar y desconectar Google y Mercado Pago, pedir el enlace de clave, cerrar otras sesiones, ver dos pasos.
- Regresiones: ninguna esperada; no cambia API ni permisos. `PanelAjustes` ya no recibe `appearance` sino `tema`. Se quitó el cuadro «Referencias nutricionales» de la pantalla: sigue en el diálogo de marca.
- Contratos: sin rutas ni tablas nuevas. Migraciones: ninguna. Automatizaciones: ninguna. Fire test: no aplica.
- Tests: `ficha-ajustes.test.ts` (4) y uno nuevo en `equipo-ajustes.test.tsx`.
- Veredicto: listo para ok visual.
