# Tareas — expansión Plan V

La secuencia vigente está en el [plan de acción de arquitectura del 2026-09-16](../docs/plan-de-accion-2026-09-16.md), IDs **PV-01…PV-39**. El siguiente bloque propuesto es [fundaciones PV-01…05](../docs/superpowers/plans/2026-09-16-plan-v-fundaciones.md): modos explícitos, privacidad, fallos IA/DB y CI. Luego persistencia, onboarding con estudios/fotos opcionales y el circuito IA → revisión → publicación.

Los pasos de abajo conservan el historial de migración funcional y visual a Nutrigo. Los once módulos profesionales ya abren superficies demo; la aprobación visual general sigue pendiente. Ninguna casilla de demo equivale a función lista para pacientes reales.

## Paso 1 — Identidad y sistema visual

### Nueva referencia local — fuente principal

- [x] Leer `.fig` y documentación sin subirlos a servicios externos: 36 frames de interfaz, 12 superficies con variantes 1440/800/390.
- [x] Registrar estructura, medidas fuente y matriz Nutrigo ↔ Plan V en `docs/nutrigo-reference-map.md`; conservar once módulos y flujos propios.
- [x] Primer corte de shell paciente: 223/892/325 en canvas de 1440, padding 28 y cuerpo a y=106 comprobados en navegador. Ocho capturas en claro/oscuro a 1440/800/390/320; navegación móvil y once módulos CRM conservados. Evidencia: `.scratch/nutrigo-local-reference/shell-verification.json`. No equivale a fidelidad completa ni aprobación visual.
- [x] Usuario confirma Poppins y compra de licencia de todo el pack Nutrigo. Fuente incorporada localmente al showroom; uso del pack autorizado por su declaración, sin afirmar una revisión legal independiente.
- [x] PV-37: contratos de layout/estado de las doce superficies a 1440/800/390/320, claro/oscuro, vacío/error/carga y `:focus-visible`. Reorganización tablet/móvil; overflow de progreso/diario corregido. **No es aprobación visual.**
- [x] PV-38: organizaciones/equipos, múltiples vínculos, delegación y suscripción B2B de estado; transferencia de ownership con hijos y auditoría. Fail closed 501. **No es SQL live ni aprobación visual.**
- [ ] Resolver componentes/overrides y revisar visualmente cada pantalla antes de declarar auditados todos sus controles.
- [x] Completar Dashboard y las once entradas del CRM desde esta fuente: todas abren superficies Nutrigo operativas; la comparación visual general sigue NO APROBADA.
- [x] Verificar que `/` abra Nutrigo por defecto en demo local y que `?design=legacy` conserve la versión anterior. Guardas de sesión/producción intactas.
- [x] Primer ajuste CRM: resumen agregado compacto, selector y seis acciones sin panel sobredimensionado; once módulos conservados. Verificación de raíz, cambio de paciente/ficha/regreso y ocho capturas en `.scratch/nutrigo-professional-compact/`.
- [x] Unificar tarjetas/gráficos del paciente seleccionado con el patrón paciente: objetivo semicircular, registro nutricional, seguimiento, plan y conversación; textos por rol, fotos ilustrativas rotuladas e historial de hidratación conservado. Falta de macros se distingue de un cero registrado. Verificados ambos roles, cuatro anchos, claro/oscuro y cambio de paciente/conversación/regreso. Evidencia: `.scratch/nutrigo-shared-dashboard/40-shared-dashboard.md`; 226 pruebas, check y build aprobados. No equivale a aprobación visual.
- [x] Completar gráficos, tarjetas y contenido CRM desde el archivo fuente: Objetivos ya reemplazó el último editor explícito anterior con una superficie Nutrigo multipaciente. La aprobación visual general sigue pendiente.
- [x] Calendario semanal del panel derecho desde el frame `28:962`: encabezado compacto, siete fechas locales, hoy/selección y estado sin plan. No confundir plantilla semanal con historial fechado. Verificados 16 vistas, 14 selecciones contra API demo, teclado y reinicio al cambiar paciente; 234 pruebas, check, build y auditorías aprobadas. Evidencia: `.scratch/nutrigo-week-calendar/41-week-calendar.md`. No es el módulo Calendario completo ni aprobación visual.
- [x] Migración operativa del directorio Pacientes al nuevo diseño: resumen, filtros, búsqueda, alta con aviso de invitación no enviada, edición de ficha, archivo/restauración reversibles y «Ver seguimiento»; el módulo ya no puentea al editor legacy. 8 checks de navegador contra API con aislamiento del otro paciente y 8 vistas responsive; 241 pruebas, check, build y auditorías aprobadas. Evidencia: `.scratch/nutrigo-patients/42-patients-directory.md`. Sin inspección visual de capturas (visión no disponible en el entorno); no es aprobación visual.
- [x] Migración de Fichas al nuevo diseño: resumen real, selector multipaciente, edición de datos, objetivo/consulta/adherencia, línea de tiempo, notas privadas de objetivos y observaciones profesionales de comidas aisladas por paciente. Vista paciente excluye estos campos. Corregida columna invisible de 325 px; main 1120 px a 1440. 6 flujos de navegador, 8 vistas, 246 pruebas y gates completos. Evidencia: `.scratch/nutrigo-patient-record/43-professional-record.md`. Resumen, Comidas, Plan y Consultas ya tienen superficies Nutrigo.
- [x] Migración de Comidas y hábitos al nuevo diseño: Actividades y Revisar comidas abren `ShowroomMeals`; selector multipaciente, cuatro métricas reales, hábitos autodeclarados, búsqueda, tabla y diálogo de confirmación/ajuste. Aislamiento defensivo de comidas/hábitos y notas privadas solo dentro del diálogo profesional; vista Paciente las excluye. Geometría Nutrigo verificada: tarjetas 72 px y secciones 104/192/368 en escritorio/tablet/móvil. 6 flujos, 8 vistas, 250 pruebas y gates completos. Evidencia: `.scratch/nutrigo-meals/44-food-diary.md`. No es aprobación visual.
- [x] Migración de Plan semanal profesional: `ShowroomMealPlan` reemplaza el puente legacy de Editar plan; selector multipaciente, siete días, edición, alta, confirmación de baja, búsqueda y vista Paciente separada de solo lectura. API demo ejercitada con cambios reversibles y estado final restaurado. Geometría Nutrigo verificada: filas 96 px en escritorio y 184 px en tablet/móvil, grilla interna de 700 px sin overflow de documento. 5 flujos, 6 vistas, 254 pruebas / 47 archivos y gates completos. Evidencia: `.scratch/nutrigo-meal-plan/45-professional-meal-plan.md`. No es aprobación visual.
- [x] Migración de Consultas profesionales: `ShowroomConsultations` reemplaza el puente legacy de Gestionar consultas; selector multipaciente, calendario mensual derivado, detalle, agendar/reagendar/cancelar y vista Paciente de solo lectura. QA aislado en `3011/5181`, con turno original restaurado y otro paciente intacto. Geometría Calendar Nutrigo: columnas 833+285, estadísticas 108/178 y celdas 120 px. 5 flujos, 6 vistas, 259 pruebas / 48 archivos y gates completos. Evidencia: `.scratch/nutrigo-consultations/46-professional-consultations.md`. Agenda completa y aprobación visual siguen pendientes.
- [x] Migración de Objetivos profesionales: `ShowroomGoals` reemplaza el último editor legacy explícito; conserva selector y filtros multipaciente, resumen agregado, avance, estados, edición, apertura de ficha e historial profesional privado. Se adaptó la composición de Progress sin inventar peso, IMC, medidas ni fotos. 5 flujos, 6 vistas, 262 pruebas / 49 archivos y gates completos. Evidencia: `.scratch/nutrigo-goals/47-professional-goals.md`.
- [x] Agenda profesional multipaciente: `ShowroomAgenda` reemplaza la apertura legacy del módulo Agenda; calendario mensual agregado con una próxima ocurrencia por paciente activo, métricas (programadas/video/presenciales/sin turno), filtros, sección Sin turno y **Gestionar consulta** que abre `ShowroomConsultations` del paciente. Reutiliza la derivación de fecha de Consultas; no inventa historial longitudinal. Vista Paciente separada y de sólo lectura. 5 flujos, 6 vistas, 266 pruebas / 50 archivos y gates completos. Evidencia: `.scratch/nutrigo-agenda/48-professional-agenda.md`. La Agenda longitudinal real sigue pendiente del contrato 016.
- [x] Centro de trabajo profesional: `ShowroomWorkCenter` reemplaza las cinco aperturas legacy restantes (Reciente, Guardado, Centro de seguimiento, Paneles y Videollamadas). Los once módulos profesionales ya permanecen dentro de Nutrigo, con acciones a Ficha/Diario/Consultas y datos agregados sin inventar historia clínica. 3 grupos de checks, 30 vistas, 275 pruebas / 51 archivos y gates completos. Evidencia: `.scratch/nutrigo-work-center/49-professional-work-center.md`.
- [x] Lista de compras paciente: `ShowroomGrocery` migra a Nutrigo la derivación conservadora ya existente del plan semanal vigente. Incluye categorías, deduplicación y ocurrencias, checklist aislado por paciente en el navegador, búsqueda, filtros y exportación; no inventa cantidades, unidades ni semanas futuras. 4 grupos de checks, 6 vistas, 279 pruebas / 52 archivos y gates completos. Evidencia: `.scratch/nutrigo-grocery/50-patient-grocery.md`.
- [x] Progreso paciente: `ShowroomProgress` reemplaza el resumen genérico por la composición Nutrigo de Progress. Presenta adherencia, objetivo publicado, agua, sueño, energía, actividad diaria y estados de comidas usando sólo la ventana segura de siete días; excluye 14 valores privados en browser QA y no inventa peso, IMC, medidas ni calorías. 3 grupos de checks, 6 vistas, 282 pruebas / 53 archivos y gates completos. Evidencia: `.scratch/nutrigo-progress/51-patient-progress.md`.
- [x] Diario paciente: `ShowroomPatientDiary` reemplaza la tarjeta genérica con resumen real, cronología, búsqueda, filtros por estado y macros sólo en comidas revisadas. **Registrar comida** abre el `MealLogModal` operativo existente re-skinizado (mismo endpoint, mismo circuito pendiente→confirmada/ajustada). QA aislado con read-back API y paciente ajeno intacto: 5 grupos de checks, 6 vistas, 286 pruebas / 54 archivos y gates completos. Evidencia: `.scratch/nutrigo-patient-diary/52-patient-food-diary.md`.
- [x] Plan semanal paciente: `ShowroomPatientPlan` reemplaza el detalle genérico por una vista Nutrigo de sólo lectura con siete días, resumen, selección diaria y búsqueda transversal. Reutiliza exclusivamente el plan publicado vigente; conserva horas sólo cuando existen para hoy y no inventa semanas futuras, recetas, macros, cantidades ni porciones. Browser QA: 5 grupos de checks, 6 vistas, 14 valores privados excluidos, 290 pruebas / 55 archivos y gates completos. Evidencia: `.scratch/nutrigo-patient-plan/53-patient-weekly-plan.md`.
- [x] Agenda paciente: `ShowroomPatientAgenda` reemplaza la tarjeta genérica por calendario mensual, detalle y acceso real a Mensajes. Conserva una sola próxima ocurrencia, duración/modalidad y enlace HTTPS endurecido; no expone gestión profesional ni inventa historial. Las fechas inválidas ya no generan una ocurrencia falsa. Browser QA: 4 grupos de checks, 6 vistas, 14 valores privados excluidos, 295 pruebas / 56 archivos y gates completos. Evidencia: `.scratch/nutrigo-patient-agenda/54-patient-agenda.md`.
- [x] Menú saludable paciente: `ShowroomHealthyMenu` reemplaza el estado «Pronto» por una superficie Nutrigo derivada exclusivamente del plan semanal publicado. Deduplica títulos, muestra días/momentos/ocurrencias, permite búsqueda y filtros, y conecta con Plan semanal y Lista de compras. Las imágenes están rotuladas como ilustrativas y la interfaz no presenta los títulos como recetas estructuradas. Browser QA: 5 grupos de checks, 6 vistas, 14 valores privados excluidos, 299 pruebas / 57 archivos y gates completos. Evidencia: `.scratch/nutrigo-healthy-menu/55-patient-healthy-menu.md`.
- [x] Mensajería Nutrigo ampliada: se confirmó y probó el envío real en ambos roles, inbox multipaciente con búsqueda/selección y perfil contextual con accesos a Agenda paciente y Ficha/Consultas profesionales. Las mutaciones se verificaron por API en servicios aislados y el otro paciente permaneció intacto. Browser QA: 6 grupos de checks, 6 vistas, 14 valores privados excluidos, 299 pruebas / 57 archivos y gates completos. Evidencia: `.scratch/nutrigo-messages/56-nutrigo-messaging.md`.
- [x] Ejercicio paciente: `ShowroomExercise` reemplaza «Pronto» con registro autodeclarado de actividad, duración, intensidad y nota; resumen real de siete días e historial. La profesional lo ve en Actividades sin editarlo ni convertirlo en rutina. API demo validada con paciente ajeno intacto; Supabase responde 501 hasta aprobar persistencia/RLS en contrato 016. Browser QA: 7 grupos de checks, 6 vistas, 17 valores privados excluidos, 305 pruebas / 59 archivos / 132 suites y gates completos. Evidencia: `.scratch/nutrigo-exercise/57-patient-activity.md`.
- [x] Recursos asignables: Guardado profesional conserva Planes B y permite elegir una de las seis guías operativas y asignarla a uno o varios pacientes. La paciente ve el bloque asignado y, al abrirlo, se registra lectura sin afectar a otras fichas. Asignaciones idempotentes, validación estricta de IDs y autorización separada `assign_resource`/`read_resource`; Supabase falla cerrado con 501. Browser QA: 5 grupos sin errores, vistas profesional 1200 y paciente móvil oscuro 390; 319 pruebas / 61 archivos / 136 suites y gates completos. Evidencia: `.scratch/nutrigo-resource-assignment/60-resource-assignment.md`.

### Tarea 1.1 — Tokens y logo compartidos — COMPLETADA

**Descripción:** convertir el logo oficial y su paleta en primitives de marca reutilizables sin cambiar todavía la composición de las pantallas.

**Aceptación:**
- [x] Un componente de logo usa el PNG oficial con tamaño/alt correctos.
- [x] Los tokens claro/oscuro reflejan la paleta documentada y reemplazan acentos ajenos al logo.
- [x] Login, carga, CRM y paciente consumen el mismo componente y tokens.

**Verificación:**
- [x] Pruebas de tema/tokens.
- [x] `npm run check` y `npm run build`.
- [x] Logo revisado en navegador en login, CRM y paciente; captura oscura sin regresiones críticas.

**Dependencias:** ninguna.  
**Alcance:** mediano.

### Tarea 1.2 — Primitives visuales — BASE FUNCIONAL; DISEÑO POR CORREGIR

**Descripción:** crear shell, sidebar, topbar, card, botón, input, badge, tabla y estados base con identidad Plan V.

**Aceptación:**
- [x] Base compartida de cards, botones, badges, progreso, anillos, barras y estados; navegación y búsqueda funcionales en el showroom.
- [x] Escalas coherentes de espacio, radio, tipografía, iconos y sombras.
- [x] Tabla del directorio con filas apiladas en móvil.

**Verificación:**
- [x] Navegación por teclado y foco visible.
- [x] Dashboard paciente probado en 1440, 800, 390 y 320 px.
- [x] Tema claro/oscuro; contraste del texto secundario en superficies claras cubierto por test AA.

**Dependencias:** 1.1.  
**Alcance:** mediano; dividir por primitive si supera cinco archivos.

### Tarea 1.3 — Showroom paciente — IMPLEMENTADO; NO APROBADO VISUALMENTE

**Descripción:** crear una vista de desarrollo aislada del Dashboard paciente usando datos demo existentes.

**Aceptación:**
- [x] Incluye resumen diario, hábitos, comidas asignadas, consulta, objetivo y navegación de lectura; módulos nuevos señalados como pendientes.
- [x] Modelo de presentación con lista explícita de campos seguros y pruebas de exclusión de notas/borradores.
- [x] Disponible solo en desarrollo/demo con `?design=nutrigo`, después de los controles existentes; no reemplaza rutas actuales.

**Verificación:**
- [x] Capturas en 1440/800/390/320, claro y oscuro.
- [x] Sin errores JS ni promesas rechazadas durante el flujo verificado.
- [x] Comparación visual con Nutrigo; sin assets del kit ni nuevas fuentes externas.

**Dependencias:** 1.1 y 1.2.  
**Alcance:** mediano.

### Tarea 1.4 — Showroom CRM — ACCESOS VERIFICADOS; NO APROBADO VISUALMENTE

**Descripción:** crear una vista aislada de CRM Inicio con navegación, lista multipaciente y panel operativo usando las mismas primitives.

**Aceptación:**
- [x] Conserva selector/lista multipaciente; accesos a ficha, comidas, plan, consultas, pacientes y objetivos en el CRM existente, con regreso al contexto de origen.
- [x] KPIs derivados de datos demo: activos, pendientes propios, adherencia media y consultas; excluye archivados.
- [x] Los once módulos visibles y probados al abrirlos desde el showroom; todos permanecen en superficies Nutrigo. Ficha/Diario/Plan/Consultas/Objetivos mantienen contexto individual y Reciente/Guardado/Seguimiento/Paneles/Videollamadas usan el centro agregado multipaciente.

**Verificación:**
- [x] Capturas en 1440/1024/800/390/320, claro y oscuro, sin overflow horizontal del showroom profesional.
- [x] Seis accesos operativos; guardado/restauración de plan y consulta con lectura posterior de API y actualización de preview; apertura/cierre del panel de revisión.
- [x] Cambio Marina → Sofía: contexto individual correcto y registro del otro paciente sin cambios. Evidencia en `.scratch/nutrigo-professional/`.

**Dependencias:** 1.1 y 1.2.  
**Alcance:** mediano.

### Tarea 1.5 — Sistema visual del consultorio — DIRECCIÓN CERRADA (corte 71)

El usuario pidió definir un estándar de app nutricional moderna y aplicarlo, en lugar de esperar parecido pixel a pixel con el kit.

**Secuencia cerrada:**
- [x] V1–V4.3: composición, densidad, tokens y capturas de referencia.
- [x] V5: dirección de consultorio: tipo ≥12 px, topbar en el workspace, menú activo en bosque, showroom canónico, `?design=legacy` como escape.
- [x] Paciente y nutricionista comparten primitives; el CRM conserva once módulos y multipaciente.

**Trabajo visual pendiente, antes de pedir aprobación nuevamente:**
- [x] Corregir composición: topbar deja de vivir al pie de la sidebar; sidebar = navegación; contenido y rail diario conservan el oficio clínico.
- [x] Recuperar la densidad y jerarquía de la referencia: el bloque grande de acciones profesionales y la duplicación de filas KPI ya no desplazan los gráficos principales (corte 62); conservados accesos y multipaciente.
- [x] Barra inferior de 4 destinos + Más (corte 72): el menú deja de vivir en la sidebar; Paciente = Inicio/Plan/Diario/Mensajes; Nutricionista = Inicio/Pacientes/Diario/Agenda. El resto abre desde Más. Tipografía y tarjetas recalibradas; el rail diario queda como panel de escritorio en Inicio.
- [x] Afinar escala/peso tipográfico, tamaños y espaciado de tarjetas, gráficos, iconos y estados (corte 71: piso de 12 px en 21 hojas CSS + capa `clinic-professional.css`; corte 72: títulos 22–26 px, métricas 22 px, barra inferior 11/22).
- [x] Resolver las miniaturas de comidas: el dashboard ya usa fotografías propias (`src/assets/showroom/*.webp`, ampliadas a 176 px en el corte 61) con rótulo explícito «Imagen ilustrativa»; el icono genérico quedó sólo como fallback. Cualquier asset nuevo requiere descubrimiento y confirmación previa.
- [x] Mantener logo/paleta Plan V y flujos profesionales, sin copiar assets del kit ni inventar datos clínicos para rellenar gráficos.
- [x] Presentar comparación lado a lado de referencia y resultado: `.scratch/nutrigo-comparison/comparison-patient-v65.png` y `comparison-pro-v65.png` con el estado de los cortes 61–63. Los tests y la ausencia de overflow no demuestran parecido visual; falta la revisión del usuario.

- [x] Comparar paciente y CRM en claro/oscuro (corte 63 + 71).
- [x] Paleta, densidad, tipografía, iconografía y responsive definidos como consultorio nutricional (corte 71).
- [x] El showroom es la interfaz canónica de la demo; `?design=legacy` queda como escape.
- [x] Ingreso paciente Nutrigo: invitación, cómo funciona, consentimiento de visibilidad, nombre preferido, hábitos opcionales y cierre hacia Plan/Diario/Inicio. Acceso desde Más → Ingreso, menú lateral escritorio y `?onboarding=1`. Sin peso, fotos corporales ni envío de email.
- [x] IA paciente Nutrigo (corte 75): diez superficies de primer nivel en menú lateral de escritorio; móvil conserva Inicio/Plan/Diario/Mensajes + Más. El CRM profesional no usa esa sidebar.
- [x] Calendario paciente mes/semana/día (corte 76): próxima consulta, plan de la semana actual, diario y actividad; eco en Agenda profesional. Sin recordatorios inventados.
- [x] Avisos de próximas consultas (corte 77): campana en paciente y nutricionista, aviso en Inicio, ocultar en el dispositivo.
- [x] Historial de turnos, reprogramación paciente, recordatorios de comidas/hábitos y avisos de navegador + buzón demo (corte 78).

## Paso 2 — Contrato ampliado

- [x] 2.1 Inventario de nuevas entidades y eventos documentado (borrador, sin SQL): `docs/contract-expansion-inventory.md`.
- [x] 2.2 Matriz de permisos nutricionista/paciente/servicio documentada en el mismo borrador, mapeada a las `PatientAction` vigentes.
- [ ] 2.3 Draft 016 ampliado y serializers seguros.
- [ ] 2.4 Matriz RLS ampliada y seeds sintéticos.
- [ ] Checkpoint de producto, clínica, privacidad y DBA; no ejecutar SQL.

## Paso 3 — Dashboard dual

- [x] 3.1 Dashboard paciente con resumen, macros, hábitos, agenda, comidas y progreso (cortes 37–66).
- [x] 3.2 Dashboard nutricionista agregado con resumen navegable: Pacientes activos, Comidas por revisar, Adherencia media y Consultas programadas abren su flujo real conservando la paciente (corte 68).
- [x] 3.3 KPIs navegables: los cuatro indicadores del dashboard abren Progreso o Diario según su dominio, conservan la paciente en el rol profesional y mantienen responsive/temas verificados. Evidencia: `.scratch/nutrigo-kpi-navigation/66-kpi-navigation.md`.

## Paso 4 — Calendario y agenda

- [x] 4.0 Agenda profesional agregada y Agenda paciente Nutrigo de sólo lectura sobre la próxima consulta vigente; calendario mensual, modalidad/duración, enlace HTTPS seguro y acceso a Mensajes.
- [x] 4.1 Vistas mes/semana/día con navegación temporal real sobre eventos fechados existentes (corte 76). El plan semanal se proyecta sólo sobre la semana lunes–domingo actual; diario y actividad usan `logged_at`.
- [x] 4.2 Eventos de consultas, comidas (plan vigente + registros) y actividad, con eco en Agenda profesional de la paciente seleccionada (corte 76).
- [x] 4.4 Avisos in-app de próximas consultas en paciente y nutricionista (corte 77): campana, recuento, aviso en Inicio y ocultar en el dispositivo.
- [x] 4.5 Historial de turnos y reprogramación de día/hora desde la paciente (corte 78). Conserva duración/modalidad; no cancela ni inventa asistencia. Eco en Consultas profesionales.
- [x] 4.6 Recordatorios de comidas/hábitos en la campana (plan de hoy, agua, descanso) y avisos de navegador + buzón demo de mail (corte 78). Sin proveedor de envío ni push remoto.
- [ ] 4.2b Zonas horarias y conflictos.
- [x] 4.3 Confirmación de asistencia del paciente sobre la próxima consulta publicada (demo local). «Necesito cambiar el horario» abre la reprogramación; cancelar/crear sigue siendo profesional. Timezone y conflictos siguen pendientes.

## Paso 5 — Mensajería

- [x] 5.0 Base Nutrigo operativa: envío paciente/profesional, actualización, inbox multipaciente, búsqueda/selección y navegación contextual a Agenda/Ficha/Consultas.
- [x] 5.1 Recibos demo: entregado al enviar, leído al abrir la conversación y recuento de no leídos. Sólo memoria; Supabase responde 501 hasta el contrato 016.
- [ ] 5.2 Adjuntos privados y archivos compartidos bajo Storage privado.

## Paso 6 — Menú saludable y recetas

- [x] 6.0 Base paciente Nutrigo derivada del plan vigente: títulos deduplicados, días, momentos, ocurrencias, búsqueda y filtros; imágenes ilustrativas rotuladas y acciones a Plan/Compras.
- [ ] 6.1 Modelar biblioteca real y categorías editoriales; los títulos actuales del plan no son recetas estructuradas.
- [ ] 6.2 Favoritos y recomendadas.
- [ ] 6.3 Detalle: porciones, macros, ingredientes, pasos, tiempos, utensilios y sustituciones.
- [ ] 6.4 Creación/aprobación/asignación profesional.

## Paso 7 — Plan semanal

- [x] 7.0 Edición profesional semanal base: siete días, títulos, alta/baja, búsqueda y selección multipaciente en diseño Nutrigo.
- [x] 7.1 Vista paciente Nutrigo de sólo lectura y aislada por paciente: siete días de la semana actual, selección diaria, resumen y búsqueda transversal; usa únicamente el plan publicado vigente.
- [ ] 7.2 Modelo fechado/versionado y navegación real entre semanas; no reutilizar semanas sintéticas de presentación como datos clínicos.
- [ ] 7.3 Recetas estructuradas, porciones/cantidades, plantillas y duplicación con autorización profesional.

## Paso 8 — Grocery

- [x] 8.0 Base paciente en Nutrigo: lista conservadora derivada del plan semanal vigente, categorías, deduplicación, ocurrencias y aviso explícito de límites.
- [ ] 8.1 Modelar ingredientes, cantidades, unidades y agregados manuales; hoy esos datos no existen y no se inventan.
- [x] 8.2 Comprado/pendiente local por paciente, búsqueda, filtros y exportación de texto.
- [ ] 8.3 Presupuesto/gastos sólo si se aprueba.

## Paso 9 — Diario de comidas

- [x] 9.0 Superficie paciente Nutrigo: resumen real, cronología, búsqueda, filtros por estado y registro operativo (foto/texto + IA) con el mismo endpoint y circuito existente.
- [x] 9.1 Historial navegable por semana calendario (lunes a domingo) sobre registros reales; semanas sin datos muestran vacío explícito y no se inventa historial. No permite semanas futuras.
- [x] 9.2 Vinculación explícita registro ↔ plan: etiqueta Del plan/Fuera del plan por día de semana y slot del plan publicado, con límite editorial explícito y sin etiqueta cuando no hay plan (corte 67).
- [x] 9.3 Revisión profesional confirmada/ajustada visible en el detalle del paciente, sin exponer notas internas (corte 71).

## Paso 10 — Progreso

- [x] 10.1 Superficie paciente Nutrigo de sólo lectura con adherencia, objetivo publicado, agua, sueño, energía y comidas revisadas en la ventana real de siete días.
- [ ] 10.2 Comparación profesional multipaciente por períodos, sin ranking punitivo; los agregados actuales no son historial longitudinal.
- [ ] 10.3 Implementar peso y medidas opcionales (alcance aprobado), con historial privado; definir consentimiento/retención antes de datos reales. Fotografías corporales siguen fuera de esta confirmación.

## Paso 11 — Ejercicio

- [x] 11.0 Registro de actividad autodeclarada: paciente carga tipo, duración, intensidad y nota; resumen de siete días e historial; la profesional lo ve aislado en Actividades. Sin calorías, rutinas ni prescripción inferida.
- [x] 11.1 Persistencia `activity_logs`, RLS, retención declarada y auditoría de asignación en Postgres descartable (fuera de 016/016b). API 501 sin schema. Live no aplicado.
- [x] 11.2 Biblioteca y detalle estructurado de ejercicios.
- [x] 11.3 Asignación de rutinas por profesional habilitado y feedback paciente. El rol nutricionista por sí solo no concede permiso de prescripción.
- [ ] 11.4 Progreso de rutinas asignadas y límites éticos adicionales, sólo después de resolver habilitación profesional y contrato.

## Paso 12 — Insights y Guardado

- [x] 12.1 Base paciente de Recursos: seis guías operativas originales, categorías, búsqueda y detalle; sin publicación clínica automática. Evidencia: `.scratch/nutrigo-resources/58-patient-resources.md`.
- [x] 12.2 Tags, relacionados, favorito persistido y compartir para las seis guías operativas permitidas. Usa enlace profundo validado, Web Share o copy-link; historial del navegador y reapertura directa verificados.
- [x] 12.3 Guardado unificado de recetas asignadas, artículos visibles, Planes B (superficie profesional) y recursos. Favoritos personales persisten en servidor; sin schema 501.
- [x] 12.4 Asignación individual/masiva de guías y artículos publicados con estado pendiente/leído; persistida en Postgres descartable y `501` sin schema.

## Paso 13 — CRM completo

- [x] 13.1 Centro de seguimiento con filtros configurables: banda de adherencia (mismas bandas de Paneles), revisiones pendientes, contador real y estado vacío honesto. La acción Revisar comidas conserva la paciente. Evidencia: `.scratch/nutrigo-followup-filters/64-followup-filters.md`.
- [x] 13.2 Paneles.
- [x] 13.3 Actividades y Reciente con filtros por paciente y recencia, paginación incremental y estado vacío honesto; sin timestamp global persistido todavía. Evidencia: `.scratch/nutrigo-recent-filters/65-recent-filters-pagination.md`.
- [x] 13.4 Videollamadas con apertura segura del enlace disponible; no se inventan estados de entrega o confirmación.
- [x] 13.5 QA de los once módulos. Evidencia base: `.scratch/nutrigo-work-center/49-professional-work-center.md`; Actividades se amplió en `.scratch/nutrigo-exercise/57-patient-activity.md`; matriz de estados vacíos en `showroom-empty-states.test.tsx` (corte 69).

## Paso 14 — Producción

- [ ] 14.1 RLS staging aprobado.
- [ ] 14.2 Auth/email/Storage/MP/IA/notificaciones reales.
- [ ] 14.3 E2E, observabilidad, backups e incidentes.
- [ ] 14.4 Despliegue y go/no-go.
- [ ] 14.5 Organizaciones y multi-nutricionista comercial.
