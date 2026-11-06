# Herramientas de estudio de producción

Pedido de Facundo, 2026-11-06: instalar 14 repos de GitHub para usar en todos los diseños
estilo estudio de producción. Cada uno se revisó en lectura antes de instalarlo.

| # | Herramienta | Repo | Dónde quedó | Licencia / nota |
|---|---|---|---|---|
| 1 | Remotion Skills | https://github.com/remotion-dev/skills | `.claude/skills/remotion-*` (13 skills, sin cambios) | Solo texto e instrucciones. Sin scripts ni instalación automática. El repo no trae archivo de licencia: rige la de Remotion (ver punto 9). |
| 2 | Blender | https://github.com/blender/blender | Solo en la PC de Facundo | Programa pesado. No va a la web ni a Railway. |
| 3 | Faster Whisper | https://github.com/SYSTRAN/faster-whisper | Solo en la PC de Facundo | Herramienta local (transcripción). Licencia MIT. |
| 4 | Chatterbox | https://github.com/resemble-ai/chatterbox | Solo en la PC de Facundo | Herramienta local (voz). Licencia MIT del código. Revisar la licencia de los modelos de voz antes de usarlos. |
| 5 | GSAP | https://github.com/greensock/GSAP | Ya es dependencia de la app (`gsap` 3.13) | Licencia "Standard no charge" de GreenSock. |
| 6 | Blender MCP | https://github.com/ahujasid/mcp-for-blender | Solo en la PC, cuando se use Blender | MIT. Su instalador (`install.sh`) baja y ejecuta un script desde internet y usa `@latest`. No usar ese instalador: fijar versión a mano. |
| 7 | Chrome DevTools MCP | https://github.com/ChromeDevTools/chrome-devtools-mcp | Referencia; se activa como MCP cuando se necesite | Apache-2.0. Tiene un script `prepare` que corre al instalar desde git: instalar desde npm con versión fija. |
| 8 | FFmpeg | https://github.com/FFmpeg/FFmpeg | Solo en la PC de Facundo | Programa pesado. Licencia LGPL/GPL según compilación. |
| 9 | Remotion | https://github.com/remotion-dev/remotion | `devDependencies` (`remotion` 4.0.541) | Licencia propia: gratis hasta 3 empleados, licencia de empresa por encima. Ver nota abajo. |
| 10 | Impeccable | https://github.com/pbakaus/impeccable | `.claude/skills/impeccable` (sin cambios), licencia Apache 2.0 en `.claude/LICENSE-impeccable` | Su lanzador baja un programa en el primer uso, con verificación de checksum. Se dejó como viene, a pedido de Facundo. |
| 11 | Three.js | https://github.com/mrdoob/three.js | `devDependencies` (`three` 0.187.0) | MIT. |
| 12 | ComfyUI | https://github.com/Comfy-Org/ComfyUI | Solo en la PC de Facundo | Programa pesado. No va a la web ni a Railway. |
| 13 | yt-dlp | https://github.com/yt-dlp/yt-dlp | Solo en la PC de Facundo | Dominio público (Unlicense). Descarga material de referencia: usarlo solo con permiso de cada autor. |
| 14 | HyperFrames | https://github.com/heygen-com/hyperframes | Ya conectado como MCP en el agente | Apache-2.0. Revisado en lectura. |

## Reglas que se respetaron

- Ninguna skill de terceros se modificó. Se copiaron tal cual.
- No se instaló el paquete ECC completo.
- Los programas pesados (Blender, FFmpeg, ComfyUI, yt-dlp, Chatterbox, Faster Whisper) no entran a la web ni a Railway.
- Ninguna clave pasó por el chat.

## Nota sobre Remotion

Remotion es gratis para personas, organizaciones sin fines de lucro y empresas de hasta 3 empleados.
Una empresa con más empleados necesita licencia de empresa. Además, su licencia no permite
vender, alquilar ni relicenciar un derivado de Remotion. Antes de usarlo en un producto que se vende,
hay que confirmar que Plan V cumple la licencia.
