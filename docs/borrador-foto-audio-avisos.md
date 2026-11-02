# Foto en borrador, audio de la consulta y diagnóstico de avisos

1/11/2026. Rama `cursor/borrador-foto-audio-avisos-d306`, desde main `48d741a9`. Borrador. Sin merge y sin producción. No toca los PR #244 y #245, ni el segundo factor, ni Mercado Pago, ni los respaldos.

## Qué cambia

1. **Página pública.** Elegir una foto ya no la guarda en la marca ni la muestra en `/slug`. Queda en el panel, marcada como borrador, hasta «Publicar cambios». Recién ahí se guarda y la página pública la muestra. Si la foto de la marca no coincide con la que se publicó, `/slug` no la muestra. Un enlace https sigue teniendo prioridad.
2. **Notas de consulta.** La ficha dice, con frases separadas, si hay permiso, si el audio se está subiendo, si se está transcribiendo y si el audio se borró o sigue guardado. Si un trabajo falló, aparece Reintentar. Lista para comprobar en producción: [consultas-audio-validacion.md](consultas-audio-validacion.md).
3. **Avisos de hábitos.** En Avisos, la paciente ve el permiso del teléfono y si este teléfono está anotado. El botón «Mandar aviso de prueba» solo aparece en local o staging, y el servidor lo rechaza en la versión publicada. El texto del aviso no lleva datos de salud. Guía para un teléfono real: [avisos-habitos-en-el-telefono.md](avisos-habitos-en-el-telefono.md).

Las páginas que hoy muestran la foto de la marca van a dejar de mostrarla hasta que la nutricionista toque «Publicar cambios» una vez. Así se confirma que esa foto es la que quiere publicar.

## Regression guard · paso 10

- Flujos críticos verificados:
  - Elegir la foto y que `/slug` no la muestre hasta publicar: ✅ prueba de la página pública y prueba de que subir el archivo no escribe la marca.
  - Publicar y que la foto coincidente sí se vea: ✅.
  - Enlace https con prioridad sobre el archivo: ✅.
  - Permiso, subida, transcripción, audio borrado y audio conservado, con y sin Reintentar: ✅.
  - Diagnóstico de avisos: permiso (cuatro casos), suscripción sí/no, prueba en staging y demo, rechazo en la versión publicada, espera entre envíos y sesión obligatoria: ✅.
  - Recorrido con sesión real en el navegador (login, ficha y teléfono): ⚠️ no se abrió la app completa. Las pantallas se comprobaron por el texto que renderizan y por la API.
- Regresiones cubiertas: la foto guardada en la marca y visible en `/slug` antes de «Publicar cambios». Si se vuelve a mostrar sin la huella publicada, fallan la prueba de la página y la del servidor. Si subir el archivo vuelve a escribir la marca, falla la lectura del cajón.
- Contratos revisados: el perfil público no incluye la huella ni obras ni avisos. El aviso de prueba no acepta un texto del cliente: el servidor manda uno fijo. En la versión publicada responde que no está disponible y no llama al envío.
- Áreas frágiles: la página pública y los avisos al teléfono. Un logo ya guardado en la marca deja de verse hasta republicar. El aviso de prueba no manda nada si el teléfono no está anotado o si faltan las claves.
- Migraciones: N/A. No hay SQL nuevo. `npm run check:migrations` aprobado.
- Fire test: se aflojó a propósito el control de la huella. Tres pruebas pasaron a rojo (la foto salía sin estar publicada). Se restauró el control y volvieron a verde. ✅
- Automatizaciones nuevas: el servidor rechaza el aviso de prueba en la versión publicada, sin depender de que alguien esconda el botón. La lista de validación del audio y la guía del teléfono quedaron escritas en `docs/`.
- Veredicto: HOLD. Falta el ok de Facundo y un recorrido en el navegador con una cuenta de prueba. No se junta a main y no se toca producción.

## Comprobaciones

`npm run check`, `npm run check:migrations` y `npm run check:secrets` aprobados. 27 pruebas de los archivos de este cambio, en 6 archivos, aprobadas.
