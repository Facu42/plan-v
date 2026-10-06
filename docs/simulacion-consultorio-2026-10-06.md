# Simulación de paciente y nutricionista — 6 de octubre de 2026

Se cargó una demostración ficticia de ambos roles mediante los formularios de la aplicación y se comprobó la lectura posterior desde la API. Los datos permanecen disponibles en esta computadora para revisar las pantallas funcionando.

## Cómo abrirla

- Paciente: http://127.0.0.1:5606/app/inicio
- Nutricionista: http://127.0.0.1:5606/crm/inicio
- En el acceso, elegir **Continuar en modo demo**. En el consultorio, seleccionar **Sofía Ramos · Demo**.
- Para iniciarla nuevamente desde este checkout: `npm run demo:consultorio`.
- Se guarda fuera de OneDrive, en `%LOCALAPPDATA%/PlanV/simulacion-consultorio/demo-state.bin`. No borrar ese archivo si se quieren conservar los ejemplos. El comando `npm run local` usa la demostración anterior y no es el comando de este ensayo persistente.

El lanzador fija API y web locales, vacía las credenciales de Supabase y activa IA de demostración. Sólo se escucha en esta computadora. El guardado no se permite en producción, staging ni cuando Supabase está habilitado. La copia guarda archivos privados ficticios; no se incorpora al repositorio.

## Datos que quedaron cargados

| Apartado | Estado visible |
| --- | --- |
| Pacientes | Sofía, Marina, Lucía y Camila Torres · Demo. Camila fue creada, archivada y restaurada; conserva invitación pendiente y enlace recuperable. |
| Ficha de Sofía | Fecha de nacimiento 12/04/1996, talla 165 cm, peso 66,3 kg; ingreso completo y revisado. Observación profesional privada. |
| Seguimiento | Historial de peso y medidas, 18 registros revisados, cintura autodeclarada 78,5 cm, estudio PDF ficticio y archivo de foto privada. Este último es una imagen del plato de ejemplo, sin persona, identificado como simulación. |
| Meta compartida | 1.902 kcal, 93 g de proteínas, 241 g de hidratos y 63 g de grasas. Cálculo con datos ficticios. |
| Plan | Publicado v6, del 5 al 11 de octubre, 28 comidas de 5 recetas. Cada receta fue revisada y publicada como v2. Se conservan cantidades, porciones e indicaciones públicas. |
| IA | Historial de generación, edición, aplicación y rechazo. Una propuesta simulada pendiente para inspeccionar en la bandeja; no reemplaza el plan publicado. |
| Recetas | Cinco recetas con nutrientes declarados ficticios; Bowl con foto manual y favorito. Las cuatro sin foto muestran el estado correspondiente. |
| Diario | Agua: 7 vasos; descanso: 8 horas. Comida con foto manual, análisis de demostración y ajuste profesional a 522 kcal / 40 g proteínas / 50 g hidratos / 18 g grasas, conservando la etiqueta de estimación de IA. |
| Mensajes | Conversación paciente/profesional con dos adjuntos reales de ejemplo, recibidos y leídos desde ambos paneles. |
| Agenda | Turno de Sofía: jueves 8, 17:15, presencial, confirmado. Historial de cambios conservado; un intento sobre horario ocupado fue rechazado sin modificar el turno. |
| Cobros | Cuota de $30.000; pago parcial de $10.000 confirmado, deuda $20.000 y aviso de $5.000 pendiente. Anulación conservada en historial. Alias ficticio `planv.simulacion`, instrucciones para no transferir. |
| Recursos | “Preparaciones de la semana · Demo”, creado, publicado, asignado, leído y guardado como favorito. |
| Compras | 20 productos, incluidos ingredientes del plan y producto manual; tres marcados como comprados. Búsqueda comprobada tras recargar. |
| Ejercicio | Rutina de cuatro ejercicios, devolución de 3 series / 12 repeticiones y caminata manual de 30 minutos. |

El plan contiene valores de ejemplo y diferencias visibles frente a la meta; no es una indicación nutricional para una persona real. La bandeja conserva tres comidas de ejemplo por revisar, un pago y una propuesta de IA para que se pueda probar su gestión.

## Recorrido para revisarlo

1. Abrir paciente, revisar **Inicio**, **Mi ficha**, **Plan** y el detalle de una receta. Cambiar porciones y comprobar que cambian los ingredientes y nutrientes. El favorito ya está guardado.
2. Ver **Diario**, **Progreso**, **Ejercicio** y **Compras**. En Progreso, “Registrar medidas y archivos” muestra los datos, los permisos opcionales y los archivos privados.
3. Abrir **Mensajes**, revisar la conversación y descargar los adjuntos. En **Recursos**, abrir la guía nueva.
4. Abrir **Pagos**: se ve deuda $20.000 y el segundo aviso pendiente. Después, en **Cobranzas** del consultorio se puede confirmar o rechazar ese aviso y volver a paciente para ver el resultado.
5. En el consultorio, revisar **Inicio**, **Pacientes** y la ficha de Sofía. La ficha concentra ingreso, registros, plan, consultas, mensajes y cobros.
6. Abrir la propuesta pendiente de **Planes**, revisar su advertencia de simulación y editar o rechazar. Sus preparaciones incompletas requieren corrección antes de publicar; la aplicación bloquea su publicación directa.
7. Revisar **Seguimiento**, **Agenda**, **Biblioteca** y **Cobranzas**. La invitación de Camila se recupera desde Pacientes; no se envió por WhatsApp ni correo.

## Errores encontrados y corregidos

- Preferencias de IA demasiado largas provocaban un error genérico: validación previa con límite de 10 líneas / 80 caracteres por línea y explicación visible, sin recortar contenido.
- La propuesta de demostración sólo construía el primer día: ahora genera cada día del período y los momentos solicitados. Se comprobó una semana completa de cuatro comidas por día.
- Aplicar, aprobar o rechazar una propuesta no actualizaba la bandeja inmediatamente: ahora comparte el evento de actualización con el consultorio.
- La ficha mostraba dos paneles de registros: se conserva uno.
- El diálogo de anulación dejaba el foco detrás: recibe foco en Cancelar, retiene navegación por teclado y Escape restaura el control anterior.
- Inicio asignaba Desayuno a todas las recomendaciones: muestra la categoría guardada de cada receta.
- Inicio agregaba tres tarjetas en la fila que Nutrigo define para dos, superponiendo nutrientes: se deriva la cantidad de los nodos originales, con sus mismas clases. Comidas ordenadas de desayuno a cena; 1,25 porciones se muestra sin redondearlo a 1,3.
- El modo de demostración perdía datos al reiniciar: se agregó guardado local opcional de los 21 dominios de memoria, con copia atómica, bloqueo contra dos servidores y restauración validada. La prueba detectó además configuración de cobros/servicio omitida; ambas quedaron incluidas y la segunda comparación completa pasó.
- El lanzador podía heredar conexiones remotas: fuerza API local y credenciales Supabase vacías incluso para impedir que Vite las cargue desde archivos de entorno.

## Evidencia y alcance

- Navegador oficial de gstack: 116 comprobaciones registradas, incluidas repeticiones de archivos y 46 vistas de paciente/consultorio a 1440 y 390 px. Sin desbordamiento horizontal de página. Tras corregir Inicio se repitieron ambas variantes, contando dos tarjetas, orden de comidas, porciones exactas y nutrientes dentro de las tarjetas.
- Reinicio: las 14 respuestas completas consultadas coincidieron antes/después; cuatro archivos mantuvieron sus hashes. Los dos adjuntos coinciden byte por byte con la imagen subida y el estudio con el PDF ficticio.
- Permiso de estudio: al retirarlo, botón bloqueado y API 403; al restaurarlo vuelve a abrir el archivo conservado. No se expusieron notas profesionales en la respuesta de ingreso del paciente.
- Las fuentes JSON, colores, medidas y clases exportadas de Nutrigo se conservan. Este ensayo agrega datos y corrige su enlace con el diseño. La revisión general del archivo está en [revisión visual anterior](revision-visual-nutrigo-2026-10-06.md); ausencia de desbordamiento no acredita por sí sola fidelidad completa a Figma.
- Suite final: **247 archivos, 1.402 pruebas aprobadas, 2 omitidas**; tipos y compilación completos. La compilación avisa sobre tamaño de algunos paquetes, sin fallar.
- Revisión independiente de código: sin hallazgos pendientes. Revisión funcional independiente de datos, reinicio, pruebas y límites realizada; comprobación final de Inicio repetida por el agente principal.
- Evidencia local ignorada por Git: `.gstack/simulacion/actions.json`, `loaded-layouts.json`, `restart-before.json`, `restart-after.json`, capturas y registros de pruebas. No contiene datos de personas reales.

### Pendientes que esta simulación no acredita

`test:auth-isolation` se intentó dos veces, pero Docker no ofreció su motor local, incluso después de iniciarlo. **No se completó la repetición de sesiones firmadas, aislamiento entre consultorios ni RLS en este entorno.** Las pruebas de memoria no sustituyen esa comprobación.

La IA ejecutada aquí es de demostración: no se comprobó un proveedor real en esta sesión. Camila conserva invitación pendiente; no se completó una aceptación mediante cuenta real ni envío externo. La confirmación del turno se comprobó mediante su contrato de API y lectura posterior; el recorrido visual comprobó creación/reprogramación e historial. No se cambió producción ni se aplicaron migraciones.
