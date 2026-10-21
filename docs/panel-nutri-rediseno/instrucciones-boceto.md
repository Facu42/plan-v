# Panel de la nutri: pasar el boceto a la app tal cual

Pedido de Facundo (20/10): que el panel quede **igual al boceto en todas las pantallas**, armado por fases y con
su aprobación para juntar cada una a `main`. Las fases 1 a 5 anteriores se apartaron del boceto porque se
**redibujó** a partir de capturas. Desde ahora el boceto no se mira: **se copia su código**.

## 1. Método (obligatorio para cualquier agente)

1. **Fuente única**: `design/panel-nutri/bocetos.html`. Cada pantalla es una función de JavaScript que devuelve
   HTML (tabla de la sección 3, con su línea). Sus estilos están en el `<style>` del mismo archivo y copiados en
   `design/panel-nutri/boceto.css`.
2. **Estilos**: la app usa `src/components/nutrigo/panel-boceto.css`, que es `boceto.css` **sin cambiar ningún
   valor**, solo con cada regla limitada al panel (prefijo `.m`) para no pisar la app de la paciente. Se genera
   con `node scripts/panel-boceto-css.mjs`; no se edita a mano. Lo que la app necesita y el boceto no tiene
   (alto de pantalla completa, desplazamiento dentro de la columna, foco de teclado) va aparte, en
   `panel-boceto-app.css`, y cada regla dice por qué.
3. **Marcado**: la función del boceto se pasa a un componente React con **las mismas etiquetas, clases y
   orden**. Solo se cambian los textos y números escritos a mano por los datos reales. Los íconos son los del
   boceto (`ic()`, línea 535), pasados a `PanelBocetoIcon`.
4. **Datos y funciones**: se conectan los que ya existen (columna «Datos y acciones» de la tabla). No se crea
   lógica nueva salvo que la pantalla del boceto lo pida y no exista; en ese caso se anota. Sin dato, el mismo
   bloque muestra cero o un texto corto (nunca se oculta ni se vacía).
5. **Tema**: oscuro por defecto, con botón a claro. El panel pone `data-mock="dark"` o `"light"` en `<html>`,
   que es lo que usa el boceto.
6. **Se borra lo que el boceto no tiene**: la barra «Pacientes / Ficha / Plan» con el selector de paciente, los
   títulos repetidos, el pie con «Privacidad · Términos» dentro del panel, la tarjeta «Directorio de pacientes»
   y cualquier envoltorio viejo. Lo que el boceto no dibuja pero es una función real se mueve a donde el
   boceto tiene su lugar (por ejemplo, el selector de paciente de Planes va en `.psel`, como en el boceto).
7. **Comprobar**: `npm run panel:contrato` (estilos resueltos contra el boceto) más la vista lado a lado, en
   claro y oscuro, a 1440×900 y 390. Cada fase suma sus piezas a `PIEZAS` en
   `scripts/panel-nutri-boceto-contrato.mjs`. Una fase no está terminada si ese comando falla en sus piezas.
8. **Una rama y un PR por fase**, con `npm test`, `npm run check` y el informe del paso 10 de
   regression-guard. **Se junta a `main` solo cuando Facundo lo aprueba.**

## 2. Lo que hoy no coincide (revisión del 20/10)

- **Todas las pantallas**: el menú lateral (líneas del árbol, contador, flecha de plegar, alto de la opción
  activa), la barra vieja arriba del contenido, el título repetido, el pie dentro del panel, el tema por defecto
  (sale «como el sistema»).
- **Inicio**: la fecha sale «Lunes, 19 De Octubre»; el encabezado suma un círculo con iniciales y un desplegable
  que el boceto no tiene; los contadores del resumen no son los del boceto (comidas, mensajes, reservas,
  cuotas vencidas, nota).
- **Pacientes**: buscador y título fuera de lugar; la tabla vive dentro de una tarjeta «Directorio de
  pacientes» con «Columnas y densidad», que el boceto no tiene; el resumen desplegado usa otra grilla.
- **Agenda, Cobranzas, Página pública**: barra vieja y doble título; botones principales con el lima apagado.
- **Asistente IA, Seguimiento, Mensajes, Progreso**: diseño viejo.
- **Planes (lista y plan de una paciente)**: diseño viejo; el boceto tiene la paciente arriba con buscador,
  semana editable, panel del día y pedidos de cambio.
- **Alimentos, Recetas, Equivalencias, Modelos, Biblioteca, Centro de ayuda, Equipo, Configuración**: diseño
  viejo.
- **Ficha**: las once pestañas existen pero con su propio marcado; el encabezado, las pestañas `.ptabs` y cada
  cuerpo deben ser los del boceto.

## 3. Pantalla por pantalla

| Pantalla | Boceto (`bocetos.html`) | Ruta | Hoy la dibuja | Datos y acciones que se conservan |
|---|---|---|---|---|
| Armazón: menú, encabezado, cuenta | `shell()` 600, `NAV`/`SUBS` 550, CSS `.sb .sbt .ni .ng .subw .si .me .hdr` | todas `/crm/*` | `NutrigoShowroom.tsx` (aside, topbar), `PanelNavigation.tsx` | `panelNavGroups` (rutas, contadores), plegado guardado, menú de cuenta, cerrar sesión, tema |
| Inicio | `inicio()` 626, `phoneInicio()` 1500 | `/crm/inicio` | `PanelHome.tsx` | bandeja «Tu consultorio, hoy», próxima consulta, accesos rápidos, pendientes con su botón |
| Pacientes | `pacientes()` 1060, `expand()` 1075, `phonePac()` | `/crm/pacientes` | `PanelPatientsTable.tsx`, `ShowroomPatients` | filtros del submenú (`?filtro=`), buscar, importar, nueva paciente, resumen desplegado con accesos a la ficha |
| Ficha (11 pestañas) | `ficha()` 1101 y `fResumen` 1112 … `fChat` 1290 | `/crm/ficha?paciente=…&seccion=…` | `ProfessionalPatientWorkspace.tsx`, `PanelPatient*.tsx` | las 14 secciones reales agrupadas como en `plan.md` §3, `?seccion=` viejos, permisos, notas por voz |
| Agenda | `agenda()` 731, `phoneAgenda()` | `/crm/agenda` | `PanelAgenda.tsx` | confirmar, cancelar, reprogramar, bloquear, tipos de consulta, conexiones |
| Cobranzas | `cobranzas()` 765 | `/crm/cobranzas` | `PanelCobranzas.tsx` | registrar cobro, recordar, exportar, filtros |
| Página pública | `publica()` 783 | `/crm/agenda?agenda=publica` | `PanelPublicPage.tsx` | editor y vista previa, publicar, copiar link |
| Asistente IA | `ia()` 814 | `/crm/desarrollo?modulo=asistente-ia` | `ProfessionalModules` | asistente de planes y cartera, tope de gasto |
| Seguimiento | `seguimiento()` 848 | `/crm/seguimiento` | `ProfessionalWorkQueue`, `MealReviewPanel` | revisar comidas, comentar, marcar revisado |
| Mensajes | `mensajes()` 872, `phoneMsg()` | `/crm/mensajes` | `NutrigoMessages.tsx` | conversaciones, sin leer, enviar, adjuntos |
| Progreso | `progreso()` 904 | `/crm/progreso-global` | `ProfessionalProgressGlobal` | métricas de cartera |
| Todos los planes | `planlista()` 1455 | `/crm/plan?planes=todos` | `ProfessionalPlans` | estado por paciente, filtros |
| Plan de una paciente | `planes()` 1360 | `/crm/plan` | `ShowroomMealPlan`, `MealPlanEditor` | elegir paciente, semana, cambiar comida, publicar, PDF, IA |
| Alimentos | `alimentos()` 923 | `/crm/alimentos` | `FoodCatalog` | SARA 2, propios, buscar |
| Recetas | `recetas()` 943 | `/crm/biblioteca?biblioteca=recetas` | `ProfessionalLibrary` | buscar, filtros, crear |
| Equivalencias | `equivalencias()` 959 | `/crm/desarrollo?modulo=equivalencias` | `NutritionExchanges` | grupos, calculadora |
| Modelos | `modelos()` 981 | `/crm/modelos` | `ModelCatalog` | usar, editar |
| Biblioteca | `biblioteca()` 993 | `/crm/biblioteca?biblioteca=recursos` | `ProfessionalLibrary` | compartir recursos |
| Centro de ayuda | `ayuda()` 1004 | `/crm/desarrollo?modulo=ayuda` | `HelpCenter.tsx` | buscar, temas |
| Equipo | `equipo()` 1020 | `/crm/desarrollo?modulo=equipo` | `ProfessionalModules` | personas, roles |
| Configuración | `config()` 1034 | `/crm/desarrollo?modulo=configuracion` | apariencia, `PanelConfigConnections`, `NutritionSettingsPanel` | tema, conexiones, seguridad |

## 4. Fases nuevas

**Ya está armado (fase A)** y cada fase lo reutiliza:
- `node scripts/panel-boceto-css.mjs` genera `src/components/nutrigo/panel-boceto.css` (estilos del boceto con el
  mismo peso extra en todas sus reglas: la raíz es `.m.desk#pv-panel`), `panel-boceto-icons.ts` (los trazos de
  `ic()`) y `public/panel-boceto/` (logo y las 8 fotos difuminadas `pb1` a `pb8`). Si el boceto cambia, se vuelve a
  correr; no se editan a mano.
- `PanelBocetoIcon` es `ic()`; `PanelBocetoShell` es `shell()` + `hdr()` + `bnav()`; `PanelNavigation` es el menú.
- Lo que la app agrega va en `panel-boceto-app.css`, con `.m#pv-panel` adelante para pesar lo mismo que el boceto.
- Una pantalla nueva se pasa así: copiar el HTML de su función del boceto a JSX (mismas etiquetas y clases, `class`
  → `className`, estilos en línea como objeto), cambiar textos y números de ejemplo por datos reales, y sacar el
  título propio de la pantalla vieja (el título lo pone el encabezado del armazón). Los títulos repetidos que
  todavía quedan dentro de Agenda, Cobranzas, Mensajes, Alimentos, Modelos y Equivalencias se van con su fase.
- Comprobar: `npm run panel:contrato` (hoy 22 piezas del armazón, todas iguales en claro y oscuro). Cada fase suma
  las suyas a `PIEZAS`: el selector es el mismo en el boceto y en la app.

Cada fase: rama propia desde `main`, un PR, contrato en verde para sus piezas, y **ok de Facundo** para juntar.

| Fase | Qué | Estado |
|---|---|---|
| A | Armazón: CSS del boceto en la app, menú lateral y submenús, flecha, cuenta, encabezado común, tema oscuro por defecto, sacar barra vieja, títulos repetidos del armazón y pie | Hecha en `claude/panel-fase-a-armazon`, espera el ok de Facundo |
| B | Inicio | Pendiente |
| C | Pacientes y resumen desplegado | Pendiente |
| D | Ficha con sus once pestañas | Pendiente |
| E | Agenda, Cobranzas y Página pública | Pendiente |
| F | Asistente IA, Seguimiento, Mensajes y Progreso | Pendiente |
| G | Planes: todos los planes y plan de una paciente | Pendiente |
| H | Alimentos, Recetas, Equivalencias y Modelos | Pendiente |
| I | Biblioteca, Centro de ayuda, Equipo y Configuración | Pendiente |

Ramas abiertas que tocan lo mismo (no se pisan; quien junte después trae `main` y resuelve):
`cursor/arreglo-mobile-fase5` (medidas del panel), `codex/panel-nutri-fase-6` (Mensajes, Seguimiento,
Progreso, con migración). Si Facundo junta una de ellas primero, la fase que corresponda parte de ahí.
