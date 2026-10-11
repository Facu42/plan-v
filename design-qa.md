# Revisión del ingreso aprobado — 2026-10-02

**Final result: passed**

Sin hallazgos P0/P1/P2 pendientes en el alcance del ingreso. Resultado local; publicación
y generaciones de IA no forman parte de esta certificación.

## Fuente, estado y comparación

- Verdad visual: `design/onboarding/reference-higgsfield.png` (2496 × 1664), generado
  con Higgsfield y aprobado por Facundo para ambos roles. Es un collage de cuatro vistas,
  sin dimensiones CSS ni densidad especificadas; se compararon sus regiones por jerarquía,
  proporciones, paleta, tipografía y contenido. No se declara igualdad píxel por píxel.
- Capturas reales: `design/onboarding/onboarding-patient-welcome-1440.png`,
  `onboarding-patient-privacy-390.png`, `onboarding-patient-profile-390.png`,
  `onboarding-professional-1440.png`, `onboarding-professional-390.png`,
  `onboarding-professional-dark-1440.png`, `onboarding-patient-dark-390.png`.
- Escritorio CSS 1440 × 900; móvil CSS 390 × 844; capturas a densidad 1×, página completa
  cuando excede la altura. Sin tablet por decisión del proyecto. La imagen fuente se
  visualizó junto a las capturas de implementación en las mismas llamadas de inspección.
- Tamaños de archivo: bienvenida 1440 × 900; privacidad/perfil/confirmación paciente
  390 × 844; profesional escritorio claro/oscuro 1440 × 931; profesional móvil 390 × 1017.
  Las alturas profesionales mayores corresponden a captura de página completa, sin escalar.
- Estados: bienvenida, privacidad sin consentimiento, perfil con cambios pendientes,
  profesional con paciente ficticio, profesional oscuro y confirmación del paciente oscura.
  Datos sólo ficticios de la API local en memoria, sin llamadas a proveedores IA.
- Comparación de vista completa y regiones: fotografía/encuadre, bloques de contenido,
  casilla/legal, campos de perfil, tres acciones profesionales y pie/CTA. Las regiones se
  revisaron en las capturas completas a resolución original; no se necesitó recortarlas.

## Cinco superficies verificadas

| Superficie | Resultado |
| --- | --- |
| Tipografía | Poppins local 400/500/600/700; títulos 30 px escritorio y 28 px paciente móvil, 25 px profesional móvil; jerarquía clara, sin cortes. La referencia no aporta medidas CSS: escala adaptada al ancho real. |
| Espacio y composición | Bienvenida de dos columnas en escritorio; una columna en móvil; tarjetas de 24 px y campos de 12 px; pie móvil permanece accesible. Márgenes y textos no se superponen, sin desborde horizontal. El consultorio conserva su navegación Figma existente. |
| Color y contraste | Crema, blanco, tinta #272932 y lima #C2E66E/#DFF9A2; gris de texto #62656F en claro. Enlace legal oscuro subrayado; texto del CTA lima #272932 también en oscuro, confirmado por estilo calculado. Foco visible y objetivos táctiles de 44–48 px. |
| Fotografía e iconos | Foto Higgsfield original con el mismo plato/ingredientes, WebP 960 × 960 de 155.644 bytes; sin textos/personas/credenciales. Foto separada de la interfaz, sin ilustraciones CSS. Logo de la app conservado e iconos de las bibliotecas existentes. |
| Contenido | Títulos/CTA del boceto presentes. Cinco etapas reales; consentimiento sin marcar; pedido propio separado del objetivo clínico. Revisión muestra restricciones y hábitos. Nombre de profesional inventado eliminado del ingreso. |

## Diferencias aceptadas al convertir el boceto en una app

- El collage dibuja ocho puntos: se implementaron las cinco etapas aprobadas, con
  confirmación separada. No se inventaron pantallas para rellenar ese indicador.
- Se conservaron marca y navegación reales. Los beneficios Plan/Diario/Mensajes usan
  iconos y texto explicativo; el profesional usa filas accionables con contexto del paciente.
- El enlace verde de bajo contraste pasa a texto oscuro subrayado. Se conserva el texto
  legal completo de la API dentro de un desplegable y la explicación para retirar permisos.
- El campo «Objetivo (opcional)» del boceto se convierte en pedido personal; el objetivo
  publicado sigue siendo sólo lectura. Guardado, errores y campos opcionales tienen estados.
- La foto se generó separadamente con la misma dirección visual; no es el recorte de la
  pantalla sintética. La bienvenida móvil usa un encuadre horizontal de ese mismo asset.
- Sin paciente, invitación/plan se explican y permanecen deshabilitados; crear/explorar
  funcionan. Con un paciente sin cuenta, las tres acciones abren sus destinos reales.

## Hallazgos corregidos e historial de comparación

1. **P2, espaciado:** reglas globales de la app anulaban márgenes del ingreso. Se aumentó
   el alcance de los selectores; bienvenida recapturada y comparada de nuevo.
2. **P2, contraste:** el tema oscuro heredaba texto claro sobre el CTA lima profesional.
   Se corrigió la especificidad para ambos ingresos; nuevo estilo calculado `rgb(39,41,50)`
   y ambas capturas oscuras verificadas junto a la referencia.
3. **P2, acceso:** Mensajes tenía prioridad sobre Primeros pasos. Se corrigió la rama de
   navegación; `qa-professional.json` confirma apertura desde esa pantalla.
4. **P2, estado:** respuesta tardía de invitación podía navegar después de cambiar paciente
   o usar historial. Se invalida la solicitud y cierra el ingreso profesional;
   `qa-navigation.json` confirma ambos casos con respuesta demorada.

## Interacciones y controles

- Casilla nueva sin marcar y Continuar deshabilitado; otorgar, retirar, volver a otorgar.
- Nombre/pedido, alimentos/restricciones y hábitos guardados; 0 vasos distinto de vacío.
- Recuperación real de etapas anteriores intent/habits y conservación del contenido.
- Revisión completa, envío confirmado, reapertura de enviado y entrada al plan.
- Crear abre el diálogo real y crea fixture; explorar abre directorio; invitación y plan
  corresponden al paciente seleccionado. Ningún WhatsApp/email externo se envió en QA.
- Cambio de paciente/historial mientras espera invitación no provoca navegación tardía.
- Consola después de limpiar el historial: sin errores en la comprobación de tema.
- 1.116 pruebas aprobadas/2 omitidas, TypeScript y build aprobados. El aviso de bundle
  mayor a 500 kB permanece registrado y no bloquea este cambio.
- Evidencias funcionales guardadas en `design/onboarding/qa-patient.json`,
  `qa-professional.json` y `qa-navigation.json`.

## Límites y seguimiento

No se prueba aquí publicación, fallos de conectividad reales, producción ni fórmulas/IA.
La suite existente de sesión/cola cubre conflictos y envío incierto; no se inyectaron esos
fallos en esta pasada visual. El canal corporal y los fallos IA/metas siguen en el informe
`docs/verificacion-ia-calorias-onboarding-2026-10-02.md`.

Checklist final: cinco etapas, consentimiento versionado, recuperación, revisión, destinos,
fotografía optimizada, tema oscuro, capturas, documentación y revisiones comprobados.
