# Auditoría de la demo contra Nutrigo (2026-10-07)

Rama `claude/inspiring-lovelace-nfsot9`. Pedido de Facundo: cargar datos de prueba, correr una demo y
ver si se ve igual que Nutrigo; revisar las fotos de platos (IA de Cloudflare en producción) y cada
página o diálogo que se abre y que el archivo de Figma no dibuja.

## Cómo repetirla

```
npm run local                          # API :3001 y web :5173 en modo demo
node --import tsx scripts/nutrigo-compare.mjs   # compara las 10 pantallas con los 20 frames
node scripts/nutrigo-audit.mjs                  # abre cada control de 12 páginas, en 1440 y 390
```

La API de demo carga sola los datos de ejemplo al iniciar (`server/demo/autoseed.ts`, no duplica;
se apaga con `DEMO_SEED=0`). Salidas en `design/auditoria/` (capturas e `informe.md`, fuera de git).

## Cómo probarlo (Facundo)

En la computadora, dentro de la carpeta del proyecto:

```
git fetch origin
git checkout claude/inspiring-lovelace-nfsot9
git pull
npm install
npm run local
```

Abrí `http://127.0.0.1:5173` y elegí **Continuar en modo demo**. Entra como Sofía con todos los datos
cargados. Probá en ancho de computadora y en celular (F12 → ícono de celular, 390 de ancho): las diez
pantallas, el menú (ícono de las tres rayas en celular), «Mis registros» en Inicio, Pagos y Mi ficha.
Los datos de la demo viven en memoria: al reiniciar `npm run local` vuelven a cargarse solos.

## Qué se encontró y se arregló

| Hallazgo | Arreglo |
|---|---|
| La demo local se abría vacía | Carga automática de datos al iniciar la API |
| «Mis registros»: Talla y Peso se montaban uno sobre otro | Ancho mínimo y `box-sizing` en los campos (1440 y 390) |
| Ingreso, recuperar clave, «Antes de seguir» y errores con estilo viejo | `auth-nutrigo.css`: Poppins, fondo Cream, tarjeta radio 16, CTA verde, tema oscuro derivado |
| Errores en inglés o técnicos (`HTTP 500`, mensajes de Supabase) | `src/lib/error-messages.ts`: todo sale en español |
| Campo de comida sin nombre accesible | `aria-label` en el detalle de `MealLogModal` |
| Aviso de cuota pendiente perdido en el diseño nuevo | Va dentro del banner amarillo del archivo («Ver pagos»); en celular, junto a «Pagos» del menú |
| Ingreso: «Atrás» y «Continuar después» daban 400 si «Sí» no tenía alimentos escritos, y decían «sin conexión» | Ahora muestran «Si hay alimentos a evitar, escribilós» y no mandan el pedido |
| `public/offline.html` con colores viejos | Colores de Nutrigo |
| Botones de «Mi ficha» grandes y menú del celular como nube de botones | Botones con la medida del archivo (13 px, radio 10). Menú nuevo (`PatientMenuSheet`): hoja inferior en celular y tarjeta centrada en escritorio, con perfil, filas con ícono, sección activa en verde, aviso de mensajes y cuota, «Mi cuenta» y «Cerrar sesión» |
| Páginas legales sin cargar Poppins (caían a la letra del sistema) | Poppins propia servida desde `public/legal/fonts/` |

## Resultado de la auditoría final

- Segunda pasada tras los arreglos: 342 controles probados, 0 con hallazgos y 0 problemas de página ni de consola (el 400 del ingreso ya no ocurre).
- Diferencia con Figma (píxeles distintos, cargados los datos de ejemplo): escritorio entre 2,6 % (Ejercicio) y
  10,8 % (Agenda); celular entre 2,3 % (Plan) y 10,4 % (Recetas). Nunca da 0 % porque los textos y datos son
  los de Plan V; el alto de cada pantalla coincide con el del archivo.

## Fotos de platos con Cloudflare (producción)

- Preparado: migración `menu_dish_covers`, disparador al publicar, worker, bucket `recipe-covers` y las
  variables de Cloudflare en API y worker (solo se comprobaron los nombres).
- **Nunca se generó una foto en producción:** la cola tiene 0 filas, porque los planes publicados son
  anteriores al disparador. Para probar: la nutricionista republica un menú o aprieta «Preparar fotos
  pendientes» en Planes.
- Mejora: cuando no hay foto, el servidor deja en el registro el motivo (`proveedor_no_configurado`,
  `limite_diario`, `http_<código>`, `respuesta_sin_imagen`), sin claves ni textos.
- Sigue sin confirmarse el plan gratuito de la cuenta ni los permisos del token: se ve con esa primera prueba.

## Segunda ronda (pedidos de Facundo tras probar la demo)

Regla que se confirmó: **se usa el código del archivo de Figma tal cual**; no se redibuja mirando capturas.
Las capturas solo sirven para medir.

| Pedido | Qué se hizo |
|---|---|
| La agenda es solo de citas con la nutricionista | La Agenda ya no mezcla plan, diario ni actividad. Tarjetas: Próximas / Confirmadas / Por confirmar con los íconos del archivo (CalendarDots, MapPinArea, Clock). Abre en el día de la próxima cita; la leyenda «Citas» es solo una etiqueta |
| Barra superior | La `Navbar` del archivo mide 390 px fijos; entre 391 y 799 px ahora ocupa todo el ancho |
| Movimiento en las tarjetas de Inicio | `home-motion.css`: entrada escalonada y, con mouse, la tarjeta se levanta, el ícono gira y las fotos se acercan. Todo dentro de «sin preferencia de reducir movimiento» |
| Tarjeta de peso con la forma del archivo | Medidor con arco naranja y resto amarillo `#ffcb65` con las líneas blancas **del propio archivo** (`assets/weight-hatch.svg` sale del nodo «Vector» del Mask group). Extremos con la escala de la regla de la tarjeta Peso |
| Menú del celular más profesional | Hoja inferior con el «Menu Nav» **original** del archivo (íconos, ítem activo y submenú), perfil arriba, «Mi cuenta» y «Cerrar sesión» |
| Registro de comida interactivo con motion moderno | En curso, con prueba primero (ver commit siguiente) |

Revisión de código (agente `code-reviewer`): sin hallazgos críticos; se corrigieron el reducir-movimiento, la apertura de la
Agenda en la próxima cita, la etiqueta accesible «Citas», el filtro que podía vaciar la agenda y los bordes del medidor (NaN, meta = inicio).

## Lo que no se aplicó

- Migración de aislamiento editorial: **no** se aplicó en la base; necesita la frase escrita de Facundo
  («aplicá la migración de aislamiento editorial en la base»).

## Pendiente

- Pantallas de la nutricionista (incluida la revisión de comidas), administración y diálogos secundarios de cuidado:
  van en otra rama, armadas con piezas del archivo, como se acordó.
- Campana y recordatorios: el texto no coincide del todo con el archivo.
