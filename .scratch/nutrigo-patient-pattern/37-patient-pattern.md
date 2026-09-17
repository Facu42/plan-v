# Pantalla patrón paciente — referencia y primera iteración

## Referencia elegida (V1)

Dashboard de escritorio visible en la portada pública de Nutrigo:
https://yellowimages.com/cdn-cgi/imagedelivery/F5KOmplEz0rStV2qDKhYag/3bf55545-91c4-45e8-a91a-84a86ff58e00/csfull

Se usa exclusivamente para comparación, guardada en `.scratch/nutrigo-patient-pattern/`. Recorte del artboard: `(582, 412, 1600, 1066)`. La preview es parcial y de menor resolución que un archivo Figma; no se puede verificar desde ella la fuente exacta ni afirmar paridad píxel a píxel. No se distribuye en el runtime ni se incorporaron assets del kit.

## Mapa de composición

| Nutrigo | Adaptación Plan V | Criterio |
| --- | --- | --- |
| Navegación lateral blanca | Menú paciente, marca oficial y controles demo al pie | Columna independiente y compacta, selección verde suave |
| Saludo y búsqueda dentro del área central | Saludo paciente y búsqueda del plan | Sin una segunda barra superior que desplace el contenido |
| Peso / pasos / sueño / agua | Adherencia / comidas revisadas / descanso / agua | Misma fila visual, sin inventar mediciones ausentes |
| Indicador semicircular + nutrición | Avance del objetivo + registro nutricional | Distribución central aproximada 1:2, altura coherente |
| Tres tarjetas de actividad | Diario / hábitos / consulta | Franja secundaria horizontal con tres tonos de marca |
| Menú recomendado + ejercicios | Plan publicado + contacto profesional | Dos columnas inferiores, menú predominante |
| Calendario y comidas laterales | Días del plan y comidas con horario | Rail derecho; no simula un calendario mensual operativo |

Las proporciones son objetivos propios deducidos visualmente de la preview, no medidas certificadas del kit. Conservamos DM Sans existente; no se identificó ni instaló una fuente nueva.

## Cambios de esta iteración (V2)

La pantalla `PatientOverview`, sus estilos aislados y las miniaturas locales ya estaban presentes al iniciar este corte; se leyeron antes de editar. Esta iteración ajustó `PatientOverview.tsx` y `patient-dashboard.css`:

- Menor espaciado vertical y tarjetas más compactas, con radios y alineaciones coherentes.
- Sidebar más compacta y scroll fino; no se modifica la navegación profesional.
- Objetivo y registro nutricional con tamaños controlados, evitando que sus contenidos estiren excesivamente la fila.
- Plan y contacto profesional juntos en una grilla 2:1 en escritorio, en vez de dos secciones de ancho completo apiladas.
- Dos comidas como resumen; `Ver plan` mantiene acceso al plan completo.
- Imágenes locales ya existentes conservadas, con recorte de presentación y advertencia ilustrativa. No se descargaron nuevas imágenes para el producto. Existe un archivo de publicaciones del proyecto bajo `archive/fotos publicaciones.zip`; no se atribuye a Nutrigo la procedencia de las miniaturas.
- Los estilos de paciente continúan limitados a `.nv-patient`/`.np-*`; no se rediseñó el CRM ni se modificaron endpoints.

## Evidencia

- Antes: `before-1440.png`.
- Resultado: `light-1440.png`, más claro/oscuro a 1440, 1280, 800, 390 y 320.
- Comparación con referencia, escalada por ancho sin deformar: `comparison.png`. Crop reproducible en `compare.py`.
- `visual-checks.json`: diez combinaciones de tamaño/tema, sin overflow horizontal; cuatro KPIs y logo cargado. En 1440 la sección de plan comienza antes de 760 px.
- `interactions.json`: búsqueda con filtro conservado, acceso a plan/mensajes, menú móvil, foco visible y apertura/retorno del CRM profesional. Sin errores JS observados.
- Suite final: 39 archivos / 206 pruebas; TypeScript y build aprobados. Auditoría sin vulnerabilidades, firmas verificadas; `git diff --check` aprobado con avisos previos de fin de línea.

## Pendiente, sin aprobación visual

- Comparación presentada para revisión; no declarar V2 ni el sistema visual aprobados.
- La referencia tiene imágenes, indicadores clínicos y calendario diferentes. Se mantiene contenido honesto de Plan V, no números/funciones ficticios para llenar la composición.
- Exactitud tipográfica y revisión definitiva de selección/recorte de imágenes permanecen abiertas.
- CRM todavía conserva la composición anterior y no entra en este corte.
- No avanzar a V3 ni reemplazar rutas hasta resolver la revisión de la pantalla patrón.
