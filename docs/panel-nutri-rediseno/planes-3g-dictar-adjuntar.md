# Planes 3g · Dictar y Adjuntar en «Armar con IA»

Los dos enlaces del boceto (`iaa="mic"` y `iaa="adj"` de `design/panel-nutri/v29/panel-trabajo.html`) dejaron de decir «Próximamente» y funcionan. El diseño no cambia: mismas clases (`iabar`, `lnk`, `lnk on`, `iafiles`).

## Qué hace
- **Dictar pedido:** usa el dictado del navegador (Web Speech, español de Argentina). Mientras escucha, el enlace dice «Escuchando…» (clase `on`, como el boceto) y vuelve a apretarse para parar. Lo dictado se suma al final del pedido. Si el navegador no dicta (por ejemplo Firefox) o no hay permiso de micrófono, avisa en español y el pedido se escribe como siempre.
- **Adjuntar referencia:** elige un PDF con texto o un archivo de texto/CSV. Se lee en el navegador (el archivo no se sube) y aparece como etiqueta con su ✕ para quitarlo (`iafiles`). Hasta 2 referencias por pedido.

## Defaults elegidos
- La IA recibe como máximo 10 líneas de 80 caracteres por pedido. Por eso de cada referencia se toman solo las primeras 2 líneas de 80 caracteres (la primera lleva el nombre del archivo) y el aviso lo dice: «La IA lee las primeras líneas de cada referencia; el resto no entra en el pedido.» Si se quiere que lea más, hay que cambiar ese límite en la API (decisión de Facundo).
- Fotos, PDF escaneados y planillas de Excel todavía no se leen (no hay OCR ni lector de planillas): avisa «copiá lo importante en el pedido».
- El boceto muestra el archivo como «plan-anterior.pdf» de ejemplo; acá se muestra el nombre real.

## Revisión contra el código del boceto
`iabar` con los dos enlaces, `iafiles` con etiquetas quitables y el estado «Escuchando…» salen del mismo marcado del boceto (líneas 5498 y 5614). El diálogo «Adjuntar» del boceto se resuelve con el selector de archivos del sistema.

## Informe Regression Guard (paso 10)
- Flujos: armar un plan con IA (pedido, ideas, opciones, crear propuesta), dictar, adjuntar y quitar referencia.
- Regresiones: ninguna esperada; sin cambios de API, permisos ni base. Sin referencias ni dictado el pedido sale igual que antes.
- Contratos: sin rutas ni tablas nuevas. Migraciones: ninguna. Automatizaciones: ninguna. Fire test: no aplica.
- Tests: `planes-referencia.test.ts` (4) y los de Planes.
- Veredicto: listo para ok visual.
