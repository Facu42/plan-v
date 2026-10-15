# Comparación del PR #105 de Codex con Figma (14/10/2026)

Hecha por Claude, sin tocar la rama de Codex. Método de `CLAUDE.md` regla 9: `npm run local` (modo demo) y
`node --import tsx scripts/nutrigo-compare.mjs` sobre `main` (ae3dc30) y sobre la cabeza de #105
(`codex/nutridesk-release-base`, 4769b3e), con los mismos frames de `design/nutrigo-frames/`.

## Resultado: la app de la paciente no cambia

| Pantalla | main | #105 | | Pantalla | main | #105 |
|---|---|---|---|---|---|---|
| Inicio escritorio | 5,0 % | 5,0 % | | Inicio celular | 6,9 % | 6,9 % |
| Agenda escritorio | 11,6 % | 11,6 % | | Agenda celular | 9,5 % | 9,5 % |
| Mensajes escritorio | 9,0 % | 9,0 % | | Mensajes celular | 8,1 % | 8,1 % |
| Recetas escritorio | 7,1 % | 7,1 % | | Recetas celular | 10,4 % | 10,4 % |
| Plan escritorio | 8,6 % | 8,6 % | | Plan celular | 4,2 % | 4,2 % |
| Compras escritorio | 5,2 % | 5,2 % | | Compras celular | 6,2 % | 6,2 % |
| Diario escritorio | 4,1 % | 4,2 % | | Diario celular | 4,5 % | 4,8 % |
| Progreso escritorio | 5,7 % | 5,7 % | | Progreso celular | 6,5 % | 6,5 % |
| Ejercicio escritorio | 3,8 % | 3,8 % | | Ejercicio celular | 5,1 % | 5,1 % |
| Recursos escritorio | 4,6 % | 4,6 % | | Recursos celular | 4,2 % | 4,2 % |

Porcentaje = píxeles distintos frente al frame de Figma (nunca llega a 0 % porque Plan V muestra sus datos
en español). La única diferencia (Diario, +0,1 y +0,3) se miró lado a lado: es la hora y el orden de los
registros de ejemplo, que se cargan al arrancar la demo. No hay cambio de diseño.

## Lo que sí cambia el PR #105 en lo visual

- **Panel de la nutricionista:** textos chicos secundarios pasan del gris claro del archivo (`--nv-muted`,
  `#8A8C90`) al gris oscuro (`--nv-ink-soft`, `#52545B`) en ficha, pacientes, mediciones y tablero. Mejora
  el contraste para leer, pero se aparta del gris del archivo. El panel no tiene frame propio en Figma
  (se arma con piezas del archivo), así que la regla «gana el archivo» no lo decide sola: lo decide Facundo.
- **Fotos de ingredientes** conectadas al código original del archivo, en recetas y menú.

## Ojo al repetir la comparación

Si `node_modules` es un enlace a otra carpeta, Vite no sirve la tipografía Poppins y las capturas salen con
letra de imprenta (falsa diferencia de varios puntos). Hay que usar una copia real de `node_modules`.

## Falta

- Ver el panel de la nutri andando para que Facundo elija el gris (el del archivo o el más oscuro de Codex).
- Probar acceso, invitaciones y recuperación con correo real: depende de la decisión de mails.
