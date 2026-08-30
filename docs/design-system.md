# Plan V — Design system (ley)

Seguir **estrictamente** `design/referencia-panel-nutri.png`. Pintar esa UI con pasteles de marca. No inventar otro layout.

## Layout panel (inmutable)
- App bar superior
- 3 columnas: menú (~177px) | Mi trabajo (~284px) | ficha
- Ítem activo del menú: cápsula lima
- Lista: avatar + nombre + preview + badge circular de score
- Selección de paciente: fondo lima suave
- Ficha: nombre grande, rail de proceso (chevrons), tabs píldora (activa = negro sólido)
- Grid de cards: contacto, Up next (tarea lima + Call / Completar), gauge radial de score, timeline, nota clínica

## Layout paciente
Shell angosto (~470px). Nav inferior glass. Card Pulse. Comidas como filas. CTA foto + agua.

## Tokens
- surface #F7FAF9 — fondo
- mint #DCEFE7 — receso, chips
- primary #3BB273 — marca, progreso
- deep #226C4B — texto de acción, botones
- coral #FF6F61 — acento, alerta humana
- yellow #FBEFC5 — comidas / calma
- lilac #EBE6F8 — agenda / suave
- ink #1B1B1B — texto
- lima #EAFF78 — selección y “up next” (de la referencia)

Sombra neumórfica: 10px 10px 24px rgba(77,112,96,.11), -8px -8px 20px rgba(255,255,255,.92).
Radios: 12–28px. Tabs: píldora. Botones: 13px.

## Tipo
- Títulos: Fraunces
- UI: DM Sans
- No Inter/Roboto como voz de marca.

## Qué no hacer
Sombras duras, bordes 1px grises de SaaS genérico, púrpura Material, ilustraciones 3D, chatbot flotante tapando la ficha.
