# IA gratuita: corrección de la configuración

Pedido de Facundo del 2/10/2026: se había acordado usar modelos gratuitos desde la API.
La revisión encontró que el modelo predeterminado seguía siendo `openai/gpt-4o-mini`,
sin un modelo explícito entre los nombres de variables de API/worker en Railway.
Eso no cumplía el pedido. No se realizaron generaciones pagas durante esta revisión.

## Cambio

- El predeterminado de texto pasa a `openrouter/free`. Este selector usa modelos gratuitos
  compatibles con la petición, incluida la salida estructurada. Fuente:
  [documentación del selector gratuito](https://openrouter.ai/docs/guides/routing/routers/free-router).
- Sin una habilitación explícita de pago (`AI_COST_MODE=paid`), se aceptan solamente ese
  selector o identificadores válidos terminados en `:free`. Un modelo pago configurado
  se rechaza; no se reemplaza silenciosamente ni se usa OpenAI como alternativa.
  API y worker no tienen `AI_COST_MODE` entre sus variables, por lo que usan el modo
  gratuito predeterminado. No se cambiaron variables ni claves de producción.
- La frontera HTTP fija precios máximos de cero para entrada, salida, petición e imagen,
  exige soporte de los parámetros, y bloquea modelos alternativos, presets, rutas,
  niveles de servicio, plugins, búsquedas y herramientas. Conserva autorización y
  cancelación; impide redirecciones. Un error de cupo no activa una opción paga.
  Fuente: [selección y precio máximo](https://openrouter.ai/docs/guides/routing/provider-selection#max-price).
- Todas las funciones actuales de texto usan ese proveedor central: recetas, menús,
  reemplazos, análisis de comidas y asistencia de seguimiento.
- Las fotos directas de OpenAI quedan deshabilitadas en modo gratuito, incluso si hubiera
  una clave. El catálogo público de OpenRouter consultado el 2/10 no listó modelos con
  salida de imagen y todos sus precios en cero. Esto describe OpenRouter consultado;
  no demuestra que no exista ningún proveedor gratuito de imágenes.

## Límites

Los modelos gratuitos tienen límites de uso y disponibilidad. La respuesta al agotarlos
es indisponibilidad/reintento, nunca cambiar a un proveedor pago ni inventar una respuesta.
Las pruebas HTTP simuladas no demuestran cuota, validez de la clave o una generación real.
No hay cambios de base, contrataciones, claves nuevas ni llamadas facturables.

El cálculo de calorías usa una fórmula fija, no requiere un modelo ni créditos. Incorporar
la meta al contexto del menú y conservar la meta confirmada al guardar otro borrador
son correcciones independientes que siguen pendientes. Tampoco se habilitan fotos con IA.

## Validación y publicación

Pruebas focalizadas iniciales: 59 aprobadas; tras ampliar el bloqueo de presets/rutas,
24 pruebas del proveedor aprobadas. Incluyen una petición real del SDK con respuesta HTTP
simulada, salida JSON estructurada, precios cero y cupo agotado sin alternativa paga.
TypeScript, comprobación de secretos y build aprobados. Persiste el aviso de tamaño del bundle.
La primera suite general agotó recursos de Windows con 22 procesos de pruebas caídos;
se repitió con un máximo de dos procesos: 216 archivos aprobados, 1.165 pruebas aprobadas
y 2 omitidas. Publicación: por registrar.

Revisiones independientes `code-reviewer` y `reality-checker`: sin brechas concretas en
las rutas actuales; se incorporó el rechazo explícito de presets sugerido por revisión.
No se afirma que todas las funciones de IA estén comprobadas ni que las imágenes funcionen.
