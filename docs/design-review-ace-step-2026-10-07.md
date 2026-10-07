# Revisión de diseño ACE-Step aplicada a Plan V

Se revisó `fspecii/ace-step-ui` como referencia de producto: paneles con profundidad, estados de interacción claros, controles que responden rápido y superficies móviles que mantienen jerarquía en pantallas pequeñas. Se conserva la identidad Nutrigo de Plan V, sus colores y la fidelidad del `.fig`.

| Antes | Después | Por qué |
| --- | --- | --- |
| Tarjetas y métricas compartían estados de foco sin una capa común de interacción. | `ace-step-polish.css` agrega profundidad, borde de foco y elevación de 2 px para tarjetas en paciente y nutricionista. | Hace visible qué superficie es accionable sin cambiar la composición del diseño fuente. |
| Los botones principales tenían respuesta distinta según el módulo. | Botones, accesos rápidos, navegación y hojas móviles usan `scale(.97)` al presionar y una curva de salida común. | La respuesta inmediata reduce la incertidumbre al tocar y mantiene coherencia entre ambos roles. |
| El cambio de pantalla dependía sólo de las animaciones de cada módulo. | La primera superficie y las tarjetas iniciales entran con una elevación corta y un escalonado de 30–60 ms. | Orienta la lectura sin bloquear la navegación ni animar el layout completo. |
| Búsquedas y controles podían perderse dentro de fondos claros u oscuros. | `:focus-within` refuerza borde y halo usando el acento vigente del tema. | Mejora teclado y contraste percibido sin agregar elementos decorativos. |
| El movimiento estaba definido por varios archivos con curvas diferentes. | Se centralizan las curvas `--nv-motion-out` y `--nv-motion-in-out`, siempre dentro de `prefers-reduced-motion`. | La app mantiene ritmo profesional y respeta la preferencia del sistema. |

## Verificación

- `npm run build` aprobado.
- `npm run check` aprobado.
- 19 pruebas de accesibilidad y consultorio aprobadas.
- Recorrido local de paciente y nutricionista en 390 px y 1440 px aprobado con gstack browse.
- `GET /api/health` local respondió `status: ok`; no quedaron errores de consola después de iniciar el API.

