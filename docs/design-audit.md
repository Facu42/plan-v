# Audit de diseño del consultorio

18/10/2026. Solo lectura. No se cambió ninguna pantalla.

Method: dual-source, sin dos agentes en paralelo y sin navegador. La crítica sale del código. El detector de Impeccable (`impeccable detect`) devolvió cero hallazgos sobre los archivos de pacientes, ficha, planes, bandeja, progreso y agenda. Eso no prueba que estén bien: el detector no mide contraste ni un nombre largo. La revisión de pautas web y la de datos extremos se hicieron a mano sobre el código.

Piel: no se propone quitar vidrio ni neumorfismo. Si algo se lee mal, se corrige contraste, foco y tamaño dentro de ese estilo. La paciente sigue en Nutrigo.

Severidad: **Alta** (cuesta trabajar o no llega a AA), **Media** (estorba, hay un rodeo), **Baja** (se nota, no frena).

## Critique (Impeccable)

El consultorio tiene dos pieles vivas. La que se usa al entrar es la de Nutrigo (Poppins, crema, lima). La de vidrio y sombra doble está en el CSS del consultorio anterior y sigue aplicada a esas clases. Las dos son intencionales. Un pulido que las unifique en un gris genérico las rompe.

La jerarquía de la ficha es el punto débil. Catorce secciones al mismo nivel (Resumen, Historia clínica, Evolución, Notas, Plan actual, Plan semanal, Compras, Registro, Chat, Archivos, Laboratorio, Planificación, Consultas, Cobros) obligan a leer una tira antes de actuar. Inicio sí prioriza: nueve tipos de pendiente y un botón «Abrir tarea».

Lo que funciona: estados vacíos con frase propia, foco visible en el directorio, la ausencia de registros no se llama incumplimiento, y los botones de la fila dicen «Ficha», «Plan» y «Seguimiento» con nombre de la paciente.

| # | Heurística | Nota | Qué se vio |
|---|---|---|---|
| 1 | Estado visible | 3 | Inicio cuenta pendientes. Un horario vencido no se presenta como consulta hecha. |
| 2 | Mundo real | 3 | Se habla de consulta, plan y registro, en voseo. |
| 3 | Control | 2 | Archivar pide confirmación. Varias pantallas de una paciente no están en el menú. |
| 4 | Consistencia | 2 | El menú agrupa distinto que la competencia y distinto que `showroom-nav.ts`. |
| 5 | Prevenir errores | 3 | La IA no publica sola. Hay aviso al salir con cambios. |
| 6 | Reconocer | 2 | Ficha, consultas y diario se reconocen solo si ya sabés la ruta. |
| 7 | Atajos | 2 | La fila de pacientes tiene atajos. Inicio no abre la ficha en un clic si no hay tarea. |
| 8 | Estética | 2 | La ficha y la bandeja muestran todo junto. El estilo no es el problema. |
| 9 | Recuperación | 3 | Los vacíos explican el próximo paso. |
| 10 | Ayuda | 1 | Centro de ayuda no está en el menú. Vive como función futura. |
| **Total** | | **23/40** | Aceptable. El arreglo grande es el menú y la ficha, no la paleta. |

## Audit técnico (Impeccable)

| # | Dimensión | Nota | Hallazgo |
|---|---|---|---|
| 1 | Accesibilidad | 2 | Texto chico y pares de color bajo AA. |
| 2 | Rendimiento | 3 | El desenfoque está en barras y tarjetas, no en listas largas animadas. |
| 3 | Temas | 2 | Tres paletas conviven. El tema oscuro aplana la sombra doble, y eso está bien solo ahí. |
| 4 | Responsive | 2 | Controles de 32 px. La agenda en semana es de siete columnas. |
| 5 | Integridad | 2 | La piel Nutrigo del shell y la piel de vidrio no están unificadas, a propósito. El menú no coincide con el objetivo. |
| **Total** | | **11/20** | Aceptable. Primero lectura y menú. |

El detector no sumó hallazgos automáticos. No se recomienda `/impeccable polish` ni `/impeccable harden` en este paso. El PR que implemente usa esos comandos después, con `DESIGN.md` como freno.

## Pautas web (archivo:línea)

### src/components/nutrigo/showroom-patients.css

- `src/components/nutrigo/showroom-patients.css:30` — el nombre en la celda no se corta ni parte palabras. Un nombre largo ensancha la fila.
- `src/components/nutrigo/showroom-patients.css:37` — los botones de la fila miden 32 px de alto. En el celular el objetivo táctil es 44 px.
- `src/components/nutrigo/showroom-patients.css:42` — el foco del directorio está bien (anillo de 2 px).

### src/components/nutrigo/showroom-patient-agenda.css

- `src/components/nutrigo/showroom-patient-agenda.css:67` — hora y título del chip a 8 px. No se lee.
- `src/components/nutrigo/showroom-patient-agenda.css:62` — chip de consulta con fondo `#FFA257`. Texto `#52545B` sobre ese naranja: 3.80:1. Blanco sobre ese naranja: 1.99:1. Los dos fallan AA.
- `src/components/nutrigo/showroom-patient-agenda.css:71` — la semana es siete columnas fijas. En 390 px cada día queda en unos 50 px.

### src/components/nutrigo/professional-workspace.css

- `src/components/nutrigo/professional-workspace.css:14` — catorce pestañas de la ficha, todas iguales, sin grupo.
- `src/components/nutrigo/professional-workspace.css:25` — desde 1280 px los nueve pendientes van en una sola fila. El rótulo de 12 px se parte en columnas angostas.
- `src/components/nutrigo/professional-workspace.css:43` — el foco de las pestañas está bien.

### src/components/nutrigo/progreso-recursos-fig.css

- `src/components/nutrigo/progreso-recursos-fig.css:221` — el buscador borra el contorno del campo. El reemplazo está en la línea 222 (`:focus-within`). No es un fallo si ese anillo se mantiene.
- `src/components/nutrigo/progreso-recursos-fig.css:95` — etiquetas del gráfico de peso a 10 px y sin corte (`white-space: nowrap`).

### src/components/nutrigo/NutrigoShowroom.tsx

- `src/components/nutrigo/NutrigoShowroom.tsx:426` — el menú son botones, no enlaces. No se abren en otra pestaña. La bandeja de Inicio sí usa un enlace (`ProfessionalWorkQueue.tsx:23`).
- `src/components/nutrigo/NutrigoShowroom.tsx:459` — Ficha y Plan de la barra superior quedan apagados si no hay una paciente elegida. No dicen por qué.
- `src/components/nutrigo/nutrigo-fidelity.css:29` — `--nv-muted` es `#8A8C90` sobre crema `#F9F4F2`: 3.09:1. Sirve para un adorno, no para una frase.

### src/plan-v.css

- `src/plan-v.css:43` — texto de la lista de trabajo a 8 y 9 px (nombre 11 px). Por debajo del piso de 12 px.
- `src/plan-v.css:48` — texto blanco sobre `#4BAEA5`: 2.66:1. El riel de proceso no se lee.
- `src/plan-v.css:62` — tarjeta de vidrio correcta en piel (radio 20, blur 8, sombra doble). No se toca la receta. Se sube el tamaño del texto interno.
- `src/plan-v.css:7` — el foco del consultorio de vidrio está definido (3 px). Conservarlo.

### src/components/nutrigo/ProfessionalProgressGlobal.tsx

- `src/components/nutrigo/ProfessionalProgressGlobal.tsx:33` — las cifras salen con `String(...)`, sin separador de miles. 1284 comidas se lee pegado.
- `src/components/nutrigo/ProfessionalProgressGlobal.tsx:49` — el nombre no tiene corte ni `min-width` propio más allá de la celda.

## Datos extremos (break-ui, desde el código)

No se armó un interruptor de demostración. Esto es lo que el código haría con datos creíbles. `full_name` es texto sin tope en la base. El formulario de ingreso de la paciente limita el nombre preferido a 40 caracteres. Una importación puede traer un nombre más largo. El correo de reserva llega a 200 caracteres (`src/types/scheduling.ts`).

| Dato | Límite real | Qué pasa |
|---|---|---|
| Nombre «María Fernanda Quiroga del Valle» | `full_name` sin tope | La celda lo envuelve. Al lado hay hasta seis botones (Ficha, Mensaje, Plan, Seguimiento, Editar, Archivar) que también envuelven. La fila se vuelve alta. |
| Nombre «Jo» | mínimo 2 en el ingreso | El avatar de dos letras queda vacío o en una letra. No hay fallback. |
| Lista vacía | 0 pacientes | El directorio dice «Sin coincidencias». Seguimiento dice «Sin pacientes en este filtro». Bien. |
| Una sola paciente | 1 | Inicio dice «1 tarea» cuando corresponde (`ProfessionalWorkQueue.tsx:61`). Bien. |
| 1.284 comidas en el período | número sin formato | Se ve `1284` pegado. |
| Objetivo vacío | el objetivo puede ir en blanco | La fila muestra el nombre y una línea vacía debajo. Parece un dato roto. |
| Agenda sin turnos | 0 consultas | Los tres indicadores quedan en 0 y «Nueva consulta» no aparece si no hay ninguna paciente (`ShowroomAgenda.tsx:127`). |
| Chip de semana con título largo | el chip recorta con puntos | A 8 px el recorte no se puede leer igual. |

Propuesta de cada uno, sin cambiar el estilo: cortar el nombre a dos líneas con el nombre completo en el tooltip. Avatar con inicial única si falta la segunda. Cifras con separador de miles (`es-AR`). Si el objetivo está vacío, mostrar «Sin objetivo» en lugar de una línea en blanco. Si no hay turnos, dejar «Nueva consulta» igual, eligiendo la paciente en el paso siguiente.

## Menú: hoy contra el objetivo

Hoy (`NutrigoShowroom.tsx`, líneas 426-436):

| Grupo de hoy | Ítems |
|---|---|
| Consultorio | Inicio, Pacientes, Agenda, Cobranzas |
| Acompañamiento | Seguimiento, Progreso global, Mensajes |
| Planes y alimentos | Planes, Alimentos, Modelos, y un botón aparte «Recetas» |
| Herramientas | Biblioteca, y Panel del servicio si es admin |
| Sin grupo | «Todas las funciones», más un desplegable de lo que todavía no está |

`showroom-nav.ts` describe una lista plana distinta (Inicio, Pacientes, Planes, Seguimiento, Progreso global, Agenda, Mensajes, Alimentos, Biblioteca, Modelos, Cobranzas). El lateral real es el de los grupos de arriba. Ficha, diario, compras, ejercicio, consultas y objetivos no están en el menú (`PRO_HIDDEN_PAGES`).

Objetivo, tomado de lo que sí está escrito:

Nutriboost, Loom minuto 3:20 (`docs/redisenio-directorio-dashboard-2026-10-09.md`): cuatro grupos — Gestión, Acompañamiento, Plan, Recursos — y, nombrados en esa nota, Asistente IA, Progreso, Recetas, Equivalencias, Modelos, Página pública y Ayuda. Academy no entra.

El plan v2 (`docs/producto/03-flujo-app.md`) lista 17 destinos. Acá se meten en los cuatro grupos vistos, no en los cinco del plan v2. Cobranzas y Página pública quedan en Gestión. El plan v2 las había separado en «Negocio». Se puede volver a separar si Facundo lo pide. No es lo que se vio en Nutriboost.

Nutridesk: no hay en `docs/` un menú con orden y nombres. `docs/producto/competencia-funciones.md` confirma tablero, agenda, cobros, reserva y ayuda, sin decir el grupo. El video de la home no se transcribió. Hasta mirar ese menú, no se copia un orden de Nutridesk.

## Propuesta de navegación

Menú lateral, de arriba a abajo:

1. **Gestión** — Inicio, Pacientes, Agenda, Cobranzas, Página pública.
2. **Acompañamiento** — Asistente IA, Seguimiento, Mensajes, Progreso.
3. **Plan** — Planes, Alimentos, Recetas, Equivalencias, Modelos, Ejercicio.
4. **Recursos** — Biblioteca, Centro de ayuda.

Reglas:

- Esos nombres, en ese orden. No se traducen ni se reordenan en el pulido visual.
- Lo que no existe se ve en su lugar, apagado, con una frase de alcance. No se esconde en «Todas las funciones».
- Panel del servicio no entra en este menú. Sigue en `/admin`.
- Configuración (logo, datos, verificación) queda en el menú de la cuenta.
- En el celular, la barra de abajo lleva Inicio, Pacientes, Seguimiento y Agenda. El resto, en «Más», con los mismos cuatro grupos.

Accesos desde Inicio, siempre visibles cuando hay pacientes:

- Cada fila de pendiente abre esa tarea (como hoy «Abrir tarea»).
- El nombre de la paciente abre su ficha.
- Al lado: Registro, Plan y Consulta, sin pasar por el lateral.

Accesos en la cabecera de la ficha, fijos, no una tira de catorce:

- Resumen, Registro, Plan, Consultas.
- «Más de esta paciente»: Historia clínica, Evolución, Notas, Compras, Chat, Archivos, Laboratorio, Planificación, Cobros.

La paciente abierta se recuerda al cambiar de sección. Si no hay ninguna, Ficha y Plan del lateral no se muestran apagados: Pacientes es el camino, y el botón lo dice.

## Mapa de rutas

| Hoy | Ruta | Mañana |
|---|---|---|
| Inicio | `/crm/inicio` | Gestión → Inicio |
| Pacientes | `/crm/pacientes` | Gestión → Pacientes |
| Agenda | `/crm/agenda` | Gestión → Agenda |
| Cobranzas | `/crm/cobranzas` | Gestión → Cobranzas |
| Página pública | no está en el menú (hay reserva en ramas sin juntar) | Gestión → Página pública, apagada hasta que exista |
| Seguimiento | `/crm/seguimiento` | Acompañamiento → Seguimiento |
| Progreso global | `/crm/progreso-global` | Acompañamiento → Progreso (mismo contenido, nombre más corto) |
| Mensajes | `/crm/mensajes` | Acompañamiento → Mensajes |
| Asistente IA | no está | Acompañamiento → Asistente IA, apagado hasta que exista |
| Planes | `/crm/plan` | Plan → Planes |
| Alimentos | `/crm/alimentos` | Plan → Alimentos |
| Recetas | `/crm/biblioteca?biblioteca=recetas` | Plan → Recetas (deja de compartir ruta con Biblioteca) |
| Modelos | `/crm/modelos` | Plan → Modelos |
| Equivalencias | `/crm/desarrollo?modulo=equivalencias` | Plan → Equivalencias |
| Ejercicio | `/crm/ejercicio` (oculto) | Plan → Ejercicio |
| Biblioteca | `/crm/biblioteca?biblioteca=recursos` | Recursos → Biblioteca |
| Centro de ayuda | no está en el menú | Recursos → Centro de ayuda, apagado hasta que exista |
| Ficha | `/crm/ficha` | No va al lateral. Se abre desde Pacientes, Inicio o la cabecera |
| Diario / registro | `/crm/diario` | Cabecera de la ficha → Registro |
| Consultas | `/crm/consultas` (oculto) | Cabecera de la ficha → Consultas, y también Agenda |
| Compras, objetivos | `/crm/compras`, `/crm/objetivos` | «Más de esta paciente» |
| Todas las funciones | `/crm/desarrollo` | Se desarma. Cada ítem vive en su grupo |

Las rutas viejas siguen abriendo la pantalla, para no romper un enlace guardado. El menú muestra el nombre nuevo.

## Comodidad: clics antes y después

Cuenta desde cualquier otra pantalla del consultorio, con pacientes ya cargadas. Un clic es una elección (menú, fila o pestaña). Escribir en un formulario no cuenta.

| Tarea | Antes | Después |
|---|---|---|
| Ver a una paciente | 2. Pacientes, después Ficha en la fila. Si ya hay una elegida, el atajo de arriba es 1, pero nace apagado. | 1 desde Inicio (el nombre) o 2 si se entra por Pacientes (grupo Gestión, primer ítem después de Inicio). |
| Revisar un check-in | 1 si Inicio ya muestra «Abrir tarea» de esa comida. Si no: Pacientes, Ficha, y la pestaña Registro alimentario entre catorce. Son 3, más el tiempo de encontrar la pestaña. | 1 desde Inicio (Registro en la fila) o 2 si ya estás en la ficha (Registro fijo en la cabecera). |
| Armar un plan | 2. Pacientes y Plan en la fila. El ítem Planes del menú abre el editor solo si ya hay una paciente. Si no, el atajo está apagado. | 2. Planes, y «Armar» en la fila de esa paciente. Desde la ficha, Plan está en la cabecera (1 clic más, no una pestaña escondida). |
| Agendar | 2, y un salto. Agenda, después «Nueva consulta», que abre Consultas, una pantalla que no está en el menú. Sin pacientes, el botón no está. | 2, sin salto. Agenda y «Nueva consulta» en la misma pantalla, con buscador de paciente. Si no hay turnos, el botón igual aparece. |

Ninguna de estas tareas queda a más de dos clics. La ficha no pide cazar una pestaña entre catorce para el registro, el plan o la consulta.

## Hallazgos priorizados

1. **Alta.** El menú no coincide con Nutriboost y esconde ficha, consultas, diario y ejercicio. Propuesta: la arquitectura de arriba, en un PR aparte. `NutrigoShowroom.tsx:426`.
2. **Alta.** La ficha tiene catorce pestañas al mismo nivel. Propuesta: cuatro fijas y el resto en «Más de esta paciente». `patient-record-sections.ts:4`, `professional-workspace.css:14`.
3. **Alta.** Texto a 8 px en la agenda y en la lista de vidrio. Propuesta: subir a 12 px lo que se lee, sin cambiar la sombra ni el vidrio. `showroom-patient-agenda.css:67`, `plan-v.css:43`.
4. **Alta.** Pares de color bajo AA: apagado `#8A8C90` sobre crema (3.09:1), texto sobre naranja `#FFA257` (3.80:1 o 1.99:1 si es blanco), blanco sobre `#4BAEA5` (2.66:1). Propuesta: oscurecer solo ese texto. No cambiar lima, crema, menta ni dorado de fondo. `nutrigo-fidelity.css` (token `--nv-muted`), `showroom-patient-agenda.css:62`, `plan-v.css:48`.
5. **Alta.** «Nueva consulta» se va a una pantalla que el menú no muestra. Propuesta: el formulario queda en Agenda. `ShowroomAgenda.tsx:127` y `NutrigoShowroom.tsx` (Agenda llama a Consultas).
6. **Media.** Botones de la fila a 32 px y hasta seis por paciente. Propuesta: 44 px de alto en el celular, y en la fila solo Ficha, Registro, Plan y Consulta. El resto, en la ficha. `showroom-patients.css:37`, `ShowroomPatients.tsx:363`.
7. **Media.** Nombres sin tope y sin corte. `full_name` es texto libre. Propuesta: dos líneas y el nombre completo al pasar el puntero. `showroom-patients.css:30`, `ShowroomPatients.tsx:350`.
8. **Media.** Cifras grandes sin separador. 1284 se lee pegado. Propuesta: formato `es-AR`. `ProfessionalProgressGlobal.tsx:33`.
9. **Media.** Nueve pendientes en una sola fila desde 1280 px. Propuesta: que pasen a dos filas antes de partir la palabra. `professional-workspace.css:25`.
10. **Media.** Ficha y Plan de la barra nacen apagados y no explican que falta elegir paciente. Propuesta: no mostrarlos hasta que haya una paciente, o decir «Elegí una paciente». `NutrigoShowroom.tsx:459`.
11. **Baja.** Objetivo vacío deja una línea en blanco bajo el nombre. Propuesta: «Sin objetivo». `ShowroomPatients.tsx:350`.
12. **Baja.** Recetas y Biblioteca comparten ruta y se distinguen por un parámetro. Propuesta: Recetas en Plan y Biblioteca en Recursos, con la ruta vieja todavía válida. `NutrigoShowroom.tsx:432`.
13. **Baja.** Títulos de gráfico a 10 px que no pueden cortarse. Propuesta: permitir dos líneas. `progreso-recursos-fig.css:95`.

Lo que no es un hallazgo: el vidrio, la sombra doble, Fraunces, DM Sans, la menta, el dorado y la lima de la paciente. No se «limpian».
