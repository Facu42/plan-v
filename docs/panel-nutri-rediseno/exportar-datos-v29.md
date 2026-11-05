# Descargar mis datos · boceto v29

Función 8 del plan contra Nutreando («exportar todo»). Ajustes › Mi cuenta › «Tus datos» › **Descargar** abre el cajón `export` del boceto (`aOpen` con `aCk`, `design/panel-nutri/v29/panel-trabajo.html`, líneas 5237 y 5295) y baja un `.zip` real.

## Qué baja
- `pacientes-y-turnos.xlsx` (o solo uno de los dos): hoja **Pacientes** (nombre, mail de la invitación, teléfono, objetivo, etapa, estado, si tiene cuenta, alta, situación) y hoja **Turnos** (fecha y hora de Argentina, paciente, duración, modalidad, estado, nota para preparar la consulta, cargado el). Excel abre el archivo sin avisos (formato abierto de Office, armado con JSZip, sin dependencias nuevas).
- `historias-clinicas/<Nombre>.pdf`, uno por paciente: datos, Historia clínica por tema (con lo dado de baja y su fecha), formulario de ingreso, mediciones, evaluaciones (laboratorio, bioimpedancia, Kerr, bariátrica, pedidos de estudios) y datos importados, con la gráfica del peso. Es el mismo PDF de la ficha (`buildClinicalPdf`), con la firma del consultorio.
- `LEEME.txt`: qué entró, cuántas filas y qué pacientes quedaron sin PDF y por qué.

## Reglas
- Solo la nutricionista (403 para otros roles). Todo se lee con su sesión: las políticas de la base siguen filtrando por consultorio.
- La historia clínica sale solo de pacientes con el permiso de atención (`care_relationship`), igual que la ficha; las mediciones, solo con el permiso de mediciones. Cada PDF deja registro de acceso «export» como la ficha.
- **No incluye las notas privadas** de la nutri. Pacientes con datos borrados a pedido no muestran nombre ni contacto; dadas de baja o con datos borrados no tienen PDF.
- `GET /api/ajustes/export?pacientes=1&turnos=1&historia=1`: es GET para que funcione también en solo lectura (vencida la prueba, la nutri siempre puede llevarse sus datos). Hasta 3 descargas por minuto por consultorio.

## Defaults elegidos (el boceto dibuja otra cosa)
- **Subtítulo y entrega:** el boceto dice «Te mandamos un link por mail cuando esté listo». Los mails propios todavía están apagados, así que el `.zip` se baja en el momento y el subtítulo dice «Se baja un archivo .zip en este dispositivo». El botón sigue siendo «Preparar» (dice «Preparando…» mientras arma el archivo) y al terminar sale el aviso de abajo «Tus datos se descargaron.».
- **Tildes:** el boceto trae «Pacientes y fichas», «Planes», «Cobros» y «Mensajes». Quedan las tres partes pedidas: «Pacientes (planilla de Excel)», «Turnos (planilla de Excel)» e «Historia clínica de cada paciente (PDF)». Planes, cobros y mensajes se pueden sumar después con el mismo cajón.
- **Nota de abajo (`.mhelp` del boceto):** avisa que son datos de salud y qué no entra. El boceto no la trae en este cajón.
- **Sin firma del consultorio:** el PDF sale con «Nutridash» arriba en lugar de frenar toda la descarga (la ficha, en cambio, pide la firma).
- Los nombres de los PDF van sin tildes («Sofia R.pdf») porque algunos descompresores de Windows las rompen.
- El diálogo anterior («Configuración y reportes», con la descarga de indicadores) sale de acá; los indicadores se siguen bajando desde el asistente del consultorio.

## Revisión contra el código del boceto
Árbol del cajón, boceto vs. app (claro y oscuro, 1440): `aside#act(header(div(h2#actt p#acts) button.ibtn) div#actb.abody(div.ack(label(input span)…)) footer#actf(button.chip span button.cta))` igual en los dos. Medidas iguales en `#act`, `header`, `h2`, `#acts`, `.abody`, `label`, `span`, `footer`, `.chip`, `.cta` y el fondo. Diferencias: tres tildes en vez de cuatro (alto de `.ack` 66 px contra 91 px), los textos de arriba y el `p.mhelp` agregado. La casilla hereda la letra del panel en vez de Arial (no se ve: es una casilla).

## Informe Regression Guard (paso 10)
- **Flujos críticos verificados:** descargar todo (✅ prueba de la ruta: zip, planilla con dos hojas, un PDF que abre y LEEME), descargar una sola parte (✅), sin ninguna parte → 400 (✅), cuarta descarga en un minuto → 429 (✅), otro rol → 403 (✅), cajón con tres tildes y Preparar (✅ prueba de pantalla), recorrido real en el navegador con la descarga (✅). Exportar la ficha de una paciente sigue igual (✅ pruebas de la ficha, mismo texto movido a `src/lib/clinical-record-lines.ts`).
- **Regresiones cubiertas:** sin permiso de atención no hay PDF (✅); pacientes con datos borrados no muestran nombre (✅); el texto de Excel no puede volverse fórmula y se escapa (✅); nombres de archivo repetidos o con barras (✅).
- **Contratos revisados:** ruta nueva `GET /api/ajustes/export` ↔ `ajustesApi.exportData` (nueva `requestFile` en `src/api/client.ts`, para descargas). Ninguna ruta existente cambió.
- **Áreas frágiles:** tiempo de armado con muchas pacientes (se arman de a 4 PDF a la vez); letra del PDF en el servidor (usa el archivo del build o la descomprime del paquete, ya instalado en la imagen de Railway).
- **Migraciones:** N/A, no toca la base.
- **Fire test:** cambiar el filtro del permiso de atención hace fallar la prueba de la ruta (espera un único PDF de la paciente con permiso).
- **Automatizaciones nuevas:** ninguna.
- **Chequeos:** `npm test` (667 archivos, 4113 pruebas) y `npm run check` en verde. `npm run panel:contrato` compara el boceto viejo (v3) y `panel:contrato:v29` se corta esperando la tabla de la Ficha; las dos fallan igual en `main`, así que el cajón se comparó con un script aparte (arriba).
- **Veredicto:** listo para el ok visual de Facundo; no se junta sin su ok.
