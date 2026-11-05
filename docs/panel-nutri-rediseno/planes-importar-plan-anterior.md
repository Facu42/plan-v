# Planes · Importar el plan anterior (5/11/2026)

Función 3 del [plan para superar a Nutreando](https://claude.ai/artifact/A4nZGVZNgsT8bBxaSEaGfv), pedida por Facundo el 5/11
(«Arranquemos por las funciones que faltan»). Nutreando la vende como «Importá tus planes de siempre (PDF, foto, Excel)».

## Qué hace
- En **Planes → Armar con IA → Adjuntar referencia** ahora se aceptan PDF (con texto o escaneado), foto JPG/PNG,
  Word (.docx), Excel (.xlsx), CSV y texto. Es el mismo diálogo del boceto v29 («Plan anterior en PDF, foto de un plan
  en papel o planilla de Excel»).
- El archivo se lee **en el navegador** con los mismos lectores de Importar pacientes (texto del PDF, OCR local de
  Tesseract para fotos y PDF escaneados, planillas y Word). No sale a ninguna IA ni se sube.
- Si reconoce comidas, aparece la tarjeta «Plan anterior: N días · M comidas» con **Usar como borrador** y
  **Solo como referencia**. Usar como borrador reemplaza el borrador de la paciente (como Aplicar plantilla) y abre el
  editor; el plan publicado se conserva y la paciente no recibe nada hasta publicar.
- El texto sigue sumándose como referencia del pedido a la IA, igual que antes.

## Cómo lee el plan (`src/components/nutrigo/planes-importar.ts`)
- Días: «Lunes»…«Domingo» y «Día N». Momentos: desayuno; colación / media mañana; almuerzo; merienda / media tarde;
  cena; «antes de dormir», «postre» y «colación nocturna» se suman a la cena con ese prefijo (el editor no muestra Extra).
- Lo que está antes del primer momento (título, nombre de la paciente, matrícula) no se toma.
- «Desayuno de campo con huevos» como plato no es un encabezado: después del momento tiene que venir «:», «-», una hora o nada.
- Planillas: días como columnas y momentos como filas, o al revés. Si no, se leen las filas como texto.
- Sin días: es un **plan tipo** y se repite 7 días.
- Límites del servidor: 150 letras por comida (se recorta con «…» y se avisa cuántas), 42 comidas y 21 días por borrador.
- Si el plan nombra días de la semana, arranca el próximo día que coincide (hoy incluido); si no, arranca hoy.

## Defaults elegidos
- Las comidas quedan como texto libre (sin alimentos de la base ni macros): la nutri las revisa y cambia por alimentos
  en el editor. Ligar cada línea a la base de alimentos queda para después.
- La tarjeta usa clases del boceto (`p28-context-link`, `iabar`, `sbtn k`, `sbtn`); el boceto no dibuja este paso.

## Revisión contra el código del boceto
- Coincide: `iabar` con «Adjuntar referencia» y «Dictar pedido», `iafiles` con la etiqueta quitable, textos del diálogo.
- Difiere: el boceto abre un diálogo «Adjuntar» con zona para soltar el archivo; la app usa el selector del sistema
  (igual que en Planes 3g). La tarjeta del plan reconocido es nueva, armada con piezas del boceto.

## Informe Regression Guard (paso 10)
- Flujos críticos: armar con IA (pedido y referencia), aplicar plantilla, guardar borrador, publicar. ✅ con pruebas.
- Regresiones cubiertas: el nombre de la paciente en el encabezado del plan no entra en el borrador (prueba).
- Contratos: el borrador pasa por `mealPlanDraftSchema` (mismo guardado que plantillas); sin rutas nuevas.
- Áreas frágiles: lectura de archivos (límites de 20 MB, 40 páginas y zip seguro heredados de Importar pacientes).
- Migraciones: ninguna. Variables nuevas: ninguna. Producción: no se tocó.
- Fire test: subir el tope de 42 comidas a 44 hace fallar «no pasa de 42 comidas ni 21 días»; revertido.
- Pruebas: `planes-importar.test.ts` (10) y `PanelPlanArmar.test.tsx`; suite completa 667 archivos, 4112 pruebas
  aprobadas y 5 omitidas; `npm run check` verde. Recorrido en el navegador (local, modo demo, 1440 y 390) con un PDF y
  con una foto leída por OCR: 2 días y 7 comidas, borrador abierto en el editor.
- Veredicto: SHIP para ok visual de Facundo.
