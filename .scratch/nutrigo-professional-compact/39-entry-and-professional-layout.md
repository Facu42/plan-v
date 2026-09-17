# Entrada local y primer ajuste del Dashboard profesional

## Alcance

- Verificada la raíz `http://127.0.0.1:5180/`: después del acceso demo muestra Nutrigo sin query. `design-entry.ts`, sus tests y la integración en `PlanVExperience` ya estaban presentes al leer el estado de trabajo; este corte los verificó, no se atribuye su creación.
- Se conserva `?design=legacy` y el enlace «Versión anterior», con retorno «Nuevo diseño». Las guardas DEV/demo/sin sesión/Supabase deshabilitado siguen activas: no se cambia el producto autenticado o de producción.
- `ProfessionalActions` usa resumen agregado compacto (dl), selector y seis acciones en una barra de trabajo; conserva aviso de memoria temporal y editores todavía anteriores.
- Estilos profesionales en `professional-dashboard.css`, scoped a `.nv-pro`: sidebar, rail, paddings, resumen y acciones responsive. Se mantiene la clase independiente `nv-messaging` y no se impone el rail de dashboard a mensajes.
- No se modificaron los modelos clínicos ni endpoints; no se habilitan peso/medidas/rutinas con este corte.

## Verificación ejecutada

- RED observado del test nuevo: faltaba `nv-pro-summary`. GREEN posterior: 11 pruebas focalizadas aprobadas.
- Suite completa: 42 archivos / 223 pruebas aprobadas en el estado observado.
- TypeScript frontend/servidor y build aprobados; build no valida la ruta DEV, comprobada aparte en navegador.
- Navegador dedicado CDP 9229: raíz sin query, 8 combinaciones únicas de 1440/800/390/320 y claro/oscuro, sin overflow horizontal ni errores JS; once módulos y seis acciones.
- Selección por teclado del segundo paciente, contexto mostrado, apertura de su ficha y retorno conservando selección.
- Enlace a versión anterior y regreso al diseño nuevo comprobados.
- Capturas `light-1440.png` y `dark-390.png` inspeccionadas visualmente. `verification.json` contiene las ocho combinaciones; gráficos antes de y=700 en escritorio.
- `git diff --check` aprobado con avisos LF/CRLF en archivos previamente modificados.

## Límites

- El Dashboard profesional es una primera adaptación, no paridad completa con Nutrigo ni aprobación visual.
- Todavía conserva gráficos/cards de la composición anterior y formularios operativos legacy. El próximo trabajo visual es aplicar componentes fuente a estos gráficos y al contenido, no declarar una migración terminada por haber cambiado el acceso.
- Había cambios de mensajería concurrentes en el árbol de trabajo; se preservaron. Este informe no declara ese flujo implementado ni verificado por este corte.
- Sin commits, push, migraciones ni despliegue.
