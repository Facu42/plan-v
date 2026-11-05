# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

La usuaria principal es la nutricionista en el consultorio. Trabaja en escritorio y en el celular. En un día típico abre la cartera, mira quién necesita algo, revisa registros, arma o ajusta un plan y deja la próxima consulta. Quiere llegar a eso con pocos clics y sin perder el paciente en el que está.

La paciente ya tiene un espacio web, solo por invitación. Una app propia para pacientes queda para más adelante: este documento no la diseña. Quien administra el servicio (altas, prueba y suspensión) no ve datos clínicos de otros consultorios.

## Product Purpose

Plan V es el consultorio nutricional en la web. La nutricionista lleva pacientes, ficha, planes, check-ins, progreso con gráficos, recetas, agenda, mensajes y cobranzas. Entre consultas, el plan y los registros reemplazan el PDF perdido.

La comodidad diaria manda: información legible, acciones a mano y un diseño agradable con movimiento breve. El éxito es que la nutricionista resuelva ver una paciente, revisar un check-in, armar un plan y agendar sin cazar pantallas escondidas.

## Positioning

No es otra app para contar calorías. Es el consultorio de la nutricionista: ella confirma la meta, revisa lo que propone la IA y publica. Una app vecina de recetas o de diario no puede decir, con verdad, que la profesional revisa antes de que algo le llegue a la paciente.

## Operating Context

Escritorio ancho (se verifica en 1440) y celular (390). Tablet no se desarrolla. La nutricionista entra por `/crm`. La paciente entra por `/app`. El panel de servicio está en `/admin`.

La navegación de hoy no está bien y hay que cambiarla. El objetivo es el orden de la competencia, que es más cómodo. Lo visto de Nutriboost (Loom, minuto 3:20, en `docs/redisenio-directorio-dashboard-2026-10-09.md`) agrupa el menú en Gestión, Acompañamiento, Plan y Recursos, e incluye Asistente IA, Progreso, Recetas, Equivalencias, Modelos, Página pública y Ayuda. Academy queda afuera. El plan escrito del producto (`docs/producto/03-flujo-app.md`, plan v2 §1) reparte 17 destinos en cinco grupos. Este documento toma los cuatro grupos vistos en Nutriboost y mete ahí esos destinos. El detalle, el antes y el después de clics, y el mapa de rutas están en `docs/design-audit.md`.

Estructura objetivo del menú lateral:

1. Gestión: Inicio, Pacientes, Agenda, Cobranzas, Página pública.
2. Acompañamiento: Asistente IA, Seguimiento, Mensajes, Progreso.
3. Plan: Planes, Alimentos, Recetas, Equivalencias, Modelos, Ejercicio.
4. Recursos: Biblioteca, Centro de ayuda.

La configuración del consultorio queda en el menú de la cuenta, no en el lateral. Lo que todavía no existe se muestra con un estado explícito («próximamente» o el alcance real). No se finge un formulario que no guarda.

Qué falta de Nutridesk: en `docs/` no hay orden, nombres ni agrupación del menú lateral de nutrideskapp.com. El video de la home no se transcribió. `docs/producto/competencia-funciones.md` lista funciones (tablero, agenda con varias agendas, cobros, página de reserva, ayuda) pero no dice en qué grupo vive cada una. Hasta que alguien mire ese menú, no se afirma que Nutridesk ordene igual que Nutriboost.

## Capabilities and Constraints

Hoy la nutricionista puede: alta con invitación, ficha, planificación con meta confirmada, editor semanal, publicar un plan, recetas y alimentos, modelos, revisión de comidas, seguimiento, progreso de la cartera, agenda, mensajes, biblioteca y cobranzas manuales. La IA propone un borrador; la profesional lo revisa antes de publicar. Nadie diagnostica.

Reglas que no se negocian:

- Un día sin registro no es un incumplimiento. Agua sin registro es desconocida. Un cero declarado es un dato válido.
- No hace falta un peso numérico para guardar un objetivo.
- Aplicar un modelo crea un borrador y conserva el plan anterior. Las recomendaciones se agregan sin duplicarse.
- Cada paciente pertenece al consultorio de su nutricionista. Nada se fija a una sola cuenta en el código.
- Lo que cargan las pacientes es información de salud. No se copia a publicidad ni a herramientas externas sin permiso.
- Producción, la base y los servicios pagos solo cambian con la frase escrita de Facundo.
- El panel móvil dedicado de la nutricionista y Academy quedan fuera.

Pendiente de decidir: precio, prueba gratis, presupuesto de IA en producción, correo, y si el menú nuevo entra de una vez o de a un grupo. La comparación completa del menú de Nutridesk también está abierta.

## Brand Commitments

El nombre es Plan V. Se habla en español, de vos. La marca del logo (verde, dorado, coral) se usa en páginas públicas; no reemplaza la paleta de la interfaz.

Dos superficies, las dos intencionales. No se mezclan:

- El consultorio de la nutricionista usa neumorfismo y vidrio, con la paleta pastel (menta y el resto) que está en el código. Tipografías, radios, sombras y el desenfoque del vidrio se respetan. El detalle visual está en `DESIGN.md`.
- El espacio de la paciente es igual a Nutrigo, colores incluidos (lima `#C2E66E`, Poppins). Es regla fija desde el 14/10/2026.

El rediseño visual mejora jerarquía, lectura y comodidad dentro de cada pantalla. La reorganización del menú es otro trabajo, posterior a este documento: no se cambia código de la app en este paso.

## Evidence on Hand

- Menú actual: `src/components/nutrigo/NutrigoShowroom.tsx` (grupos) y `src/components/nutrigo/showroom-nav.ts` (lista y pantallas ocultas).
- Tokens que pinta el consultorio de vidrio: `src/plan-v.css` pisa a `design/tokens-panel-nutri.css`.
- Superficie de la paciente: `design/nutrigo-fidelity.md` y `src/components/nutrigo/nutrigo-fidelity.css`.
- Competencia: `docs/producto/competencia-funciones.md`, `docs/redisenio-directorio-dashboard-2026-10-09.md`, `docs/producto/03-flujo-app.md`, `docs/inicio-seguimiento-vs-nutriboost-2026-10-10.md`, `docs/mediciones-vs-nutriboost-2026-10-10.md`.
- No hay capturas nuevas del menú de Nutriboost ni de Nutridesk en este paso. No se inventan ítems que esas fuentes no nombran.

## Product Principles

1. La nutricionista llega a la paciente, al check-in, al plan y a la agenda sin pantallas escondidas.
2. La IA propone. La profesional publica.
3. Un hueco en los datos se dice como hueco, nunca como falla de la paciente.
4. Lo que todavía no funciona se muestra apagado y explicado.
5. La piel visual no se aplana para parecer genérica. El menú sí se reordena hacia la competencia, en un cambio aparte.

## Accessibility & Inclusion

El texto y el foco cumplen contraste WCAG AA. El foco se ve. El movimiento respeta la preferencia de menos animación. El arreglo de contraste y de foco se hace dentro del estilo de cada superficie: no se elimina el vidrio ni el neumorfismo para «ganar» accesibilidad.
