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

## Lo que no se aplicó

- Migración de aislamiento editorial: **no** se aplicó en la base; necesita la frase escrita de Facundo
  («aplicá la migración de aislamiento editorial en la base»).

## Pendiente

- Pantallas de la nutricionista (incluida la revisión de comidas), administración y diálogos secundarios de cuidado:
  van en otra rama, armadas con piezas del archivo, como se acordó.
- Campana y recordatorios: el texto no coincide del todo con el archivo.
