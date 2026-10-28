// Compara el armazón de la nutri contra el boceto v29 (design/panel-nutri/v29/panel-trabajo.html).
//
// Mide las mismas piezas en la fuente y en la app (claro y oscuro). No compara el texto:
// compara medidas y colores resueltos. Si una pieza falta o difiere más de 0,6 px, falla.
// `npm run panel:contrato` (el viejo) sigue midiendo bocetos.html y no es el de esta fase.
//
// Uso (app en demo: `npm run local`):
//   node scripts/panel-v29-contrato.mjs          → imprime el informe y sale con 1 si algo no coincide
//   node scripts/panel-v29-contrato.mjs --write  → además lo guarda en design/panel-nutri/v29/contrato-informe.md
import { usarAgendaDeEjemplo } from './panel-v29-agenda-ejemplo.mjs';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
function playwright() {
  try { return require('playwright'); } catch { try { return require('playwright-core'); } catch { return require(`${process.env.PLAYWRIGHT_GLOBAL ?? '/opt/node22/lib/node_modules'}/playwright`); } }
}

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
export const FUENTE = resolve(raiz, 'design/panel-nutri/v29/panel-trabajo.html');
const boceto = `file://${FUENTE}`;
const origen = process.env.PLANV_ORIGIN ?? 'http://127.0.0.1:5173';
const TOLERANCIA_PX = 0.6;

// Piezas del armazón v29. El selector es el del HTML de panel-trabajo.html, no el de React.
export const PIEZAS_V29 = [
  ['Menú lateral · ancho', '.app .side', '', ['width']],
  ['Marca', '.app .logo .mk', '', ['width', 'height', 'borderTopLeftRadius', 'backgroundColor']],
  ['Nombre (Plan V)', '.app .logo b', '', ['fontSize', 'fontWeight', 'fontFamily', 'color']],
  ['Título de grupo (Gestión)', '.app .grp h6', '', ['fontSize', 'fontWeight', 'letterSpacing', 'textTransform', 'color']],
  ['Opción del menú', '.app .nv:not(.on)', '', ['fontSize', 'fontFamily', 'color', 'borderTopLeftRadius']],
  ['Opción activa', '.app .nv.on', '', ['backgroundColor', 'color', 'fontWeight']],
  ['Ícono de la opción', '.app .nv svg.i', '', ['width', 'height']],
  ['Contador', '.app .nv .ct', '', ['fontSize', 'backgroundColor', 'color']],
  ['Contador naranja', '.app .nv .ct.hot', '', ['backgroundColor', 'color']],
  ['Flecha de plegar', '.app .fold', '', ['width', 'height', 'borderTopLeftRadius', 'boxShadow', 'backgroundColor']],
  ['Buscador del menú', '.app .srch', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Cuenta', '.app .acct', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Columna principal', '.app .main', '', ['paddingTop', 'paddingLeft']],
  ['Título de la pantalla', '.app .top h1', '', ['fontSize', 'fontWeight', 'fontFamily', 'color']],
  ['Campana', '.app .top .ibtn', '', ['width', 'height', 'borderTopLeftRadius']],
  ['CTA', '.app .top .cta', '', ['backgroundColor', 'color']],
];

// Piezas de la Ficha: encabezado, solapas y Resumen. El encabezado es el de Nutreando (`.fh.ntfh`), que es el que quedó en el boceto.
export const PIEZAS_FICHA = [
  ['Encabezado', '#s-ficha .card.fh', '', ['borderTopLeftRadius', 'paddingTop', 'paddingLeft']],
  ['Avatar', '#s-ficha .fh .av', '', ['width', 'height', 'fontSize', 'backgroundColor']],
  ['Migaja', '#s-ficha .fh .crumb', '', ['fontSize', 'color']],
  ['Nombre', '#s-ficha .fh h1', '', ['fontSize', 'fontWeight', 'letterSpacing']],
  ['Etiqueta', '#s-ficha .fh .tg2', '', ['fontSize', 'borderTopLeftRadius', 'paddingLeft']],
  ['Estado de la app', '#s-ficha .fh .appst b', '', ['fontSize', 'color']],
  ['Botón del encabezado', '#s-ficha .ntfhg > .chip', '', ['height', 'fontSize', 'borderTopLeftRadius', 'paddingLeft']],
  ['Iniciar consulta', '#s-ficha .ntfhg > .cta', '', ['height', 'backgroundColor', 'color', 'borderTopLeftRadius']],
  ['Solapas', '#ftabs', '', ['paddingLeft', 'borderBottomWidth', 'borderBottomColor']],
  ['Solapa', '#ftabs button:not(.on)', '', ['fontSize', 'paddingTop', 'paddingLeft', 'color']],
  ['Solapa elegida', '#ftabs button.on', '', ['fontWeight', 'color', 'backgroundColor']],
  ['Contador de la solapa', '#ftabs .n', '', ['fontSize', 'borderTopLeftRadius', 'paddingLeft']],
  ['Mosaico', '#s-ficha .fxtile', '', ['borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'backgroundColor']],
  ['Número del mosaico', '#s-ficha .fxtile .fxv b', '', ['fontSize', 'fontWeight']],
  ['Panel', '#s-ficha .fxp:not(.fxtile)', '', ['borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'backgroundColor']],
  ['Título del panel', '#s-ficha .fxp > header h3', '', ['fontSize', 'fontWeight']],
  ['Fila', '#s-ficha .fxr > *', '', ['paddingTop', 'paddingLeft']],
  ['Título de la fila', '#s-ficha .fxr .t b', '', ['fontSize', 'fontWeight']],
  ['Tarjeta oscura', '#s-ficha .fxdk', '', ['borderTopLeftRadius', 'backgroundColor', 'paddingTop', 'paddingLeft']],
  ['Medio círculo', '#s-ficha .pg', '', ['width']],
  ['Datos en columna', '#s-ficha .fxkv > div', '', ['paddingTop', 'fontSize']],
];

// Piezas de la solapa Mediciones de la Ficha. Kerr y las filas de la tabla dependen de datos que la demo no trae: se miran en las capturas.
export const PIEZAS_MEDICIONES = [
  ['Panel de medidores', '#s-ficha .fxgauges', '', ['gap', 'gridTemplateColumns']],
  ['Medidor chico', '#s-ficha .fxgauges .pg', '', ['width']],
  ['Nombre del medidor', '#s-ficha .fxgauges small', '', ['fontSize', 'color']],
  ['Nota del medidor', '#s-ficha .fxgauges em', '', ['fontSize', 'color']],
  ['Solapas de medidas', '#s-ficha .fxp .tabs', '', ['borderTopLeftRadius', 'paddingTop', 'backgroundColor']],
  ['Solapa de medidas elegida', '#s-ficha .fxp .tabs button.on', '', ['fontSize', 'fontWeight', 'backgroundColor']],
  ['Encabezado de la tabla', '#s-ficha .fxtb th', '', ['fontSize', 'color', 'paddingTop']],
  ['Botón de fórmula', '#s-ficha .fxp > header .chip', '', ['height', 'fontSize', 'borderTopLeftRadius']],
  ['Botón chico', '#s-ficha .fxp > header .sbtn', '', ['height', 'fontSize', 'borderTopLeftRadius']],
];

// Piezas de la solapa Laboratorio y estudios. La demo no trae informes ni permiso: la app se mira con valores de ejemplo simulados (`simularLaboratorio`).
export const PIEZAS_LABORATORIO = [
  ['Tabla de valores', '#s-ficha .lbt table th', '', ['fontSize', 'color', 'paddingTop', 'textTransform']],
  ['Fecha de la columna', '#s-ficha .lbch', '', ['gap', 'fontSize', 'borderTopLeftRadius']],
  ['Fecha en número', '#s-ficha .lbch b', '', ['fontSize', 'fontWeight']],
  ['Nombre del valor', '#s-ficha .lbt tr[data-lbr] td b, #s-ficha .lbt tbody tr:not(.lbg) td b', '', ['fontSize', 'fontWeight']],
  ['Último valor', '#s-ficha .lbt td.last', '', ['fontSize', 'fontWeight', 'color']],
  ['Valor fuera de rango', '#s-ficha .lbt td.out', '', ['color']],
  ['Referencia', '#s-ficha .lbt td.u', '', ['fontSize', 'color']],
  ['Solapas Valores y Por fecha', '#s-ficha .tabs.lbv', '', ['borderTopLeftRadius', 'paddingTop', 'backgroundColor']],
  ['Curva del valor', '#s-ficha .lbchart', '', ['width']],
  ['Banda del rango', '#s-ficha .lbband', '', ['fill']],
  ['Punto de la curva', '#s-ficha .lbpt', '', ['stroke', 'strokeWidth']],
  ['Historial del valor', '#s-ficha .lbhist > div', '', ['paddingTop', 'fontSize']],
];

// Piezas de la solapa Historia clínica. La demo no trae datos ni permiso de atención: la app se mira con una historia de ejemplo simulada (`simularHistoria`).
export const PIEZAS_HISTORIA = [
  ['Índice de temas', '#s-ficha .hcidx', '', ['borderRightWidth', 'paddingRight', 'gap']],
  ['Tema del índice', '#s-ficha .hcidx > button', '', ['fontSize', 'borderTopLeftRadius', 'paddingTop']],
  ['Tema elegido', '#s-ficha .hcidx > button.on', '', ['backgroundColor', 'borderTopLeftRadius']],
  ['Punto del tema', '#s-ficha .hcidx .st', '', ['width', 'height', 'backgroundColor']],
  ['Título del tema', '#s-ficha .hced h4', '', ['fontSize', 'fontWeight']],
  ['Dato', '#s-ficha .hce', '', ['borderTopLeftRadius', 'paddingTop', 'paddingLeft']],
  ['Texto del dato', '#s-ficha .hcin', '', ['fontSize', 'lineHeight']],
  ['Origen del dato', '#s-ficha .hcsrc', '', ['fontSize', 'borderTopLeftRadius', 'paddingLeft']],
  ['Dato dado de baja', '#s-ficha .hcpast s', '', ['fontSize', 'color']],
  ['Solapas Por tema y Por fecha', '#s-ficha .tabs.hcv', '', ['borderTopLeftRadius', 'paddingTop', 'backgroundColor']],
];

// Piezas de la solapa Objetivos y hábitos. El objetivo viene de la paciente de la demo; los hábitos sin registro muestran «—».
export const PIEZAS_OBJETIVOS = [
  ['Anillo del objetivo', '#s-ficha .fxgoals .fxring', '', ['width', 'height']],
  ['Número del anillo', '#s-ficha .fxgoals .fxring b', '', ['fontSize', 'fontWeight']],
  ['Nombre del objetivo', '#s-ficha .fxgoals b', '', ['fontSize', 'fontWeight']],
  ['Hábito', '#s-ficha .fxhab > div', '', ['borderTopLeftRadius', 'paddingTop', 'paddingLeft']],
  ['Columnas de la semana', '#s-ficha .fxwk', '', ['height', 'gap']],
  ['Síntomas y energía', '#s-ficha .fxp.g > header h3', '', ['fontSize', 'fontWeight']],
];

// Piezas de la solapa Registro alimentario. La demo trae comidas de ejemplo; «Contra el plan» no existe en Plan V y no se dibuja.
export const PIEZAS_ALIMENTARIO = [
  ['Contra el plan', '#s-ficha .fxtb tbody .pill', '', ['fontSize', 'height', 'borderTopLeftRadius']],
  ['Botón Confirmar', '#s-ficha .fxtb tbody .sbtn.k', '', ['height', 'width', 'fontSize']],
  ['Barra de proteínas', '#s-ficha .fxmacros .fxb.k i', '', ['height', 'backgroundColor']],
  ['Título del panel', '#s-ficha .fxp.g > header h3', '', ['fontSize', 'fontWeight', 'lineHeight', 'height']],
  ['Botón del encabezado', '#s-ficha .fxp > header .sbtn.k', '', ['height', 'width', 'fontSize']],
  ['Botón Descargar', '#s-ficha .fxp > header .sbtn:not(.k)', '', ['height', 'width']],
  ['Fila de comida', '#s-ficha .fxtb tbody td', '', ['height', 'fontSize']],
  ['Comida y hora', '#s-ficha .fxwhen b', '', ['fontSize', 'fontWeight']],
  ['Foto de la comida', '#s-ficha .fxtb .who .photo', '', ['width', 'height', 'borderTopLeftRadius']],
  ['Qué comió', '#s-ficha .fxtb .who b', '', ['fontSize', 'fontWeight']],
  ['Barras de macros', '#s-ficha .fxmacros > div', '', ['gap']],
  ['Título de panel', '#s-ficha .fxp > header h3', '', ['fontSize', 'fontWeight']],
  ['Lo que ve la IA', '#s-ficha .fxai', '', ['borderTopLeftRadius', 'paddingTop']],
];

// Piezas de la solapa Plan. El plan sale del plan publicado de la demo; las calorías que el plan no trae quedan en blanco.
export const PIEZAS_PLAN = [
  ['Título de panel', '#s-ficha .fxp.g > header h3', '', ['fontSize', 'fontWeight', 'lineHeight', 'height']],
  ['Fila de comida', '#s-ficha .fxmeals li', '', ['height', 'display']],
  ['Botón del encabezado', '#s-ficha .fxp > header .sbtn.k', '', ['height', 'width', 'fontSize']],
  ['Pedido de cambio', '#s-ficha .fxask', '', ['paddingTop', 'paddingLeft', 'borderTopLeftRadius', 'fontSize']],
  ['Botón Aprobar', '#s-ficha .fxask .sbtn.k', '', ['fontSize', 'paddingLeft', 'borderTopLeftRadius']],
  ['Hora de la comida', '#s-ficha .fxmeals time', '', ['fontSize', 'color']],
  ['Foto de la comida', '#s-ficha .fxmeals .photo', '', ['width', 'height', 'borderTopLeftRadius']],
  ['Momento', '#s-ficha .fxmeals .tx small', '', ['fontSize', 'color']],
  ['Nombre de la comida', '#s-ficha .fxmeals .tx b', '', ['fontSize', 'fontWeight', 'lineHeight']],
  ['Calorías de la comida', '#s-ficha .fxmeals .kc b', '', ['fontSize', 'fontWeight']],
  ['Medidor del requerimiento', '#s-ficha .fxsplit .pg', '', ['width']],
  ['Barras de macros', '#s-ficha .fxmacros .fxb', '', ['height', 'borderTopLeftRadius']],
  ['Barra de proteínas', '#s-ficha .fxmacros .fxb.k i', '', ['height', 'backgroundColor']],
  ['Columnas por comida', '#s-ficha .fxcols i', '', ['width', 'borderTopLeftRadius']],
  ['Lista de compras', '#s-ficha .fxkv > div', '', ['paddingTop', 'fontSize', 'height']],
];

// Piezas de Asistente. El encabezado vive en el armazón; acá se mide el cuerpo, que existe en los dos.
export const PIEZAS_ASISTENTE = [
  ['Caja del pedido', '#s-asistente .sxask textarea', '', ['fontSize', 'fontFamily', 'borderTopLeftRadius', 'height']],
  ['Quién habla', '#sxchat .sxfrom', '', ['fontSize', 'fontFamily', 'textTransform', 'letterSpacing']],
  ['Tarjeta de gasto', '#s-asistente .fxdk', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Barra del tope', '#s-asistente .fxdkp', '', ['height', 'borderTopLeftRadius']],
  ['Avatar de la fuente', '#s-asistente .fxr .av', '', ['width', 'height', 'borderTopLeftRadius']],
];

// Piezas de Alimentos. El buscador vive en el encabezado; el detalle, en el cuerpo.
export const PIEZAS_ALIMENTOS = [
  ['Buscador', '.top .sxin', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Campo de búsqueda', '.top .sxin input', '', ['fontSize', 'fontFamily', 'width']],
  ['Nombre del alimento', '#s-alimentos .sxwho b', '', ['fontSize', 'fontWeight', 'fontFamily']],
  ['Tarjeta de energía', '#s-alimentos .fxdk', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Barra de energía', '#s-alimentos .fxdkp', '', ['height', 'borderTopLeftRadius']],
  ['Macros', '#s-alimentos .sxmac > div', '', ['fontSize']],
  ['Barra de un macro', '#s-alimentos .sxmac .fxb', '', ['height', 'borderTopLeftRadius']],
  ['Pestaña de porción', '#s-alimentos .tabs button', '', ['fontSize', 'borderTopLeftRadius']],
];

export const PIEZAS_PLANES = [
  ['Secciones de Planes', '#s-planes #pview', '', ['borderTopLeftRadius', 'backgroundColor', 'minHeight']],
  ['Sección activa', '#s-planes #pview button.on', '', ['backgroundColor', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight']],
  ['Buscador del listado', '#s-planes .r29-search', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Nombre en la tabla', '#s-planes .r29-table .who b', '', ['fontSize', 'fontWeight', 'fontFamily']],
  ['Filtro del listado', '#s-planes .r29-list-filters .tabs button', '', ['fontSize', 'borderTopLeftRadius', 'fontWeight', 'letterSpacing', 'lineHeight']],
  ['Filtro activo', '#s-planes .r29-list-filters .tabs button.on', '', ['fontWeight', 'fontSize', 'letterSpacing']],
  ['CTA Nuevo plan', '.top .cta', '', ['minWidth', 'fontWeight', 'fontSize', 'letterSpacing', 'lineHeight', 'borderTopLeftRadius']],
  ['Acción de la fila', '#s-planes .r29-table .sbtn', '', ['height', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'paddingTop', 'borderTopLeftRadius']],
  ['Empezar con el asistente', '#s-planes .sbtn.k', '', ['height', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'paddingTop', 'borderTopLeftRadius']],
  ['Orden del listado', '#s-planes .r29-list-filters select', '', ['height', 'fontSize', 'letterSpacing', 'lineHeight']],
];

export const PIEZAS_EMPEZAR = [
  ['Armar con el asistente', '#s-planes .pstart .sbtn.k', '', ['height', 'display', 'gap', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'paddingTop', 'borderTopLeftRadius', 'backgroundColor', 'color']],
  ['Elegir plantilla', '#s-planes .pstart .sbtn:not(.k)', '', ['height', 'display', 'gap', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'paddingTop', 'borderTopLeftRadius']],
];

export const PIEZAS_EDITOR = [
  ['Día del editor', '#s-planes .pedays button', '', ['fontSize', 'borderTopLeftRadius', 'fontWeight', 'letterSpacing', 'lineHeight', 'paddingTop']],
  ['Día activo', '#s-planes .pedays button.on', '', ['backgroundColor', 'borderTopLeftRadius', 'color']],
  ['Semana activa', '#s-planes .pewk button.on', '', ['backgroundColor', 'color', 'width', 'height', 'borderTopLeftRadius', 'letterSpacing', 'lineHeight']],
  ['Fila Comidas', '#s-planes #ptabs', '', ['paddingTop', 'paddingLeft', 'borderTopLeftRadius', 'backgroundColor', 'height', 'lineHeight', 'gap', 'marginLeft']],
  ['Barra de las pestañas', '#s-planes.pux-plan .prow2', '', ['height', 'lineHeight', 'borderTopLeftRadius', 'gap']],
  ['Pestaña del editor', '#s-planes #ptabs button', '', ['fontSize', 'borderTopLeftRadius', 'letterSpacing', 'lineHeight', 'paddingTop', 'paddingLeft', 'height']],
  ['Pestaña Comidas', '#s-planes #ptabs button.on', '', ['backgroundColor', 'fontWeight', 'letterSpacing', 'lineHeight']],
  ['Duplicar día', '#s-planes .petool .lnk', '', ['fontSize', 'fontWeight', 'letterSpacing', 'lineHeight']],
  ['Día o semana', '#s-planes .pedit .iaseg button', '', ['fontSize', 'letterSpacing', 'lineHeight', 'paddingTop', 'borderTopLeftRadius']],
  ['Contexto del plan', '#s-planes .r29-context', '', ['borderTopLeftRadius', 'minHeight']],
  ['Editar metas', '#s-planes .r29-context > .sbtn:not(.r29-care-toggle)', '', ['height', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'paddingTop', 'borderTopLeftRadius']],
  ['Cuidado', '#s-planes .r29-care span', '', ['height', 'fontSize', 'lineHeight', 'paddingTop', 'borderTopLeftRadius', 'backgroundColor', 'color']],
  ['Asistente IA', '#s-planes .r29-tools .sbtn', '', ['gap', 'minHeight', 'height', 'fontSize', 'letterSpacing', 'lineHeight']],
  ['Deshacer', '#s-planes .r29-tools .ibtn', '', ['width', 'height', 'color', 'borderTopColor', 'paddingTop', 'borderTopLeftRadius', 'letterSpacing', 'lineHeight']],
  ['Hora de la comida', '#s-planes .pux-hour', '', ['width', 'height', 'fontSize', 'letterSpacing', 'lineHeight', 'paddingTop', 'borderTopLeftRadius']],
  ['Sumar a la comida', '#s-planes .pema .ibtn', '', ['width', 'height', 'paddingTop', 'borderTopLeftRadius', 'borderTopColor', 'letterSpacing', 'lineHeight']],
];

export const PIEZAS_BIBLIOTECA = [
  ['Grilla de recursos', '#s-biblioteca .sxlib', '', ['display', 'gap']],
  ['Tarjeta de recurso', '#s-biblioteca .sxcard', '', ['backgroundColor', 'borderTopLeftRadius', 'paddingTop', 'textAlign']],
  ['Tarjeta elegida', '#s-biblioteca .sxcard.on', '', ['borderTopColor', 'backgroundColor']],
  ['Título del recurso', '#s-biblioteca .sxcard b', '', ['fontSize', 'fontWeight', 'fontFamily', 'color']],
  ['Tipo del recurso', '#s-biblioteca .sxk', '', ['fontSize', 'letterSpacing', 'color']],
  ['Descripción', '#s-biblioteca .sxcard p', '', ['fontSize', 'lineHeight', 'color']],
  ['Acción de asignar', '#s-biblioteca .fxp header .chip', '', ['fontSize', 'borderTopLeftRadius', 'backgroundColor']],
];

// Piezas de Progreso. El selector existe en el boceto y en la app.
export const PIEZAS_PROGRESO = [
  ['Avatar de la cartera', '#s-progreso .fxr .av', '', ['width', 'height', 'borderTopLeftRadius']],
  ['Nombre en la lista', '#s-progreso .sxwho b', '', ['fontSize', 'fontWeight', 'fontFamily']],
  ['Etiqueta de la lista', '#s-progreso .pill', '', ['fontSize', 'fontWeight']],
  ['Chip Evolución', '#s-progreso .fxr .chip', '', ['fontSize', 'borderTopLeftRadius']],
  ['Tarjeta de evolución', '#sxevo .fxdk', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Pestaña de filtro', '#s-progreso .sxtools .tabs button', '', ['fontSize', 'borderTopLeftRadius']],
];

// Piezas de Inicio. Se miden con la pantalla abierta, antes de ir a otra.
export const PIEZAS_INICIO = [
  ['Tarjeta de Pendientes', '#s-inicio .iup .card', '', ['borderTopLeftRadius', 'backgroundColor', 'height', 'paddingTop']],
  ['Título de la tarjeta', '#s-inicio .iup .ch h2', '', ['fontSize', 'fontWeight', 'fontFamily']],
  ['Fila de la lista', '#s-inicio .iup .li.pick', '', ['paddingTop', 'paddingLeft', 'borderTopLeftRadius', 'fontSize']],
  ['Ícono de la fila', '#s-inicio .iup .li .ico', '', ['width', 'height', 'borderTopLeftRadius']],
  ['Tipo de la fila', '#s-inicio .iup .li .kind', '', ['fontSize', 'color']],
  ['Motivo de atención', '#s-inicio .iup .li .why', '', ['fontSize', 'borderTopLeftRadius']],
  ['Tarjeta oscura', '#det', '', ['borderTopLeftRadius', 'backgroundColor', 'height', 'paddingTop']],
  ['Número grande', '#det .xhero b', '', ['fontSize', 'fontWeight', 'letterSpacing']],
  ['Botón principal', '#det .xacts button.go', '', ['height', 'backgroundColor', 'color', 'borderTopLeftRadius']],
  ['Encabezado de la tabla', '#s-inicio .hoy th', '', ['fontSize', 'letterSpacing', 'textTransform', 'color']],
  ['Tarjeta de número', '#s-inicio .kpi', '', ['height', 'paddingTop', 'paddingLeft', 'borderTopLeftRadius']],
  ['Número de la tarjeta', '#s-inicio .kpi .v', '', ['fontSize', 'fontWeight']],
  ['Pie de la tarjeta', '#s-inicio .kpi .ft', '', ['fontSize', 'color']],
];

// Piezas de Pacientes, con la primera fila desplegada (el boceto la trae abierta).
export const PIEZAS_PACIENTES = [
  ['Tarjeta de la lista', '#s-pacientes .card.pt', '', ['borderTopLeftRadius', 'backgroundColor', 'paddingTop', 'paddingLeft']],
  ['Solapas', '#pfil', '', ['borderTopLeftRadius', 'paddingTop', 'backgroundColor']],
  ['Solapa elegida', '#pfil button.on', '', ['fontSize', 'backgroundColor', 'color', 'paddingTop', 'paddingLeft']],
  ['Chip de orden', '#s-pacientes .ch .chip', '', ['fontSize', 'borderTopLeftRadius', 'paddingTop', 'height']],
  ['Encabezado de la tabla', '#s-pacientes th', '', ['fontSize', 'letterSpacing', 'textTransform', 'color', 'paddingTop']],
  ['Celda de la fila', '#prows tr[data-i] td:nth-child(2)', '', ['height', 'paddingLeft', 'fontSize']],
  ['Avatar', '#prows .who .av', '', ['width', 'height', 'fontSize', 'borderTopLeftRadius']],
  ['Nombre', '#prows .who b', '', ['fontSize', 'fontWeight']],
  ['Estado', '#prows .pill', '', ['fontSize', 'borderTopLeftRadius', 'paddingLeft']],
  ['Patología', '#prows .pat', '', ['fontSize', 'borderTopLeftRadius', 'paddingLeft']],
  ['Barra de adherencia', '#prows .adh .tr', '', ['width', 'height', 'borderTopLeftRadius']],
  ['Fila abierta', '#prows tr.open td', '', ['backgroundColor']],
  ['Detalle: panel', '#prows .pdin > section', '', ['borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'backgroundColor']],
  ['Detalle: botón principal', '#prows .pd-acts .go', '', ['height', 'backgroundColor', 'color', 'borderTopLeftRadius']],
  ['Detalle: botón', '#prows .pd-acts button:not(.go)', '', ['height', 'fontSize', 'borderTopLeftRadius', 'backgroundColor']],
  ['Detalle: número', '#prows .pd-v b', '', ['fontSize', 'fontWeight', 'letterSpacing']],
  ['Detalle: columna de números', '#prows .pd-t', '', ['paddingTop', 'paddingLeft', 'borderLeftWidth']],
  ['Detalle: próximo turno', '#prows .pd-next', '', ['backgroundColor', 'borderTopLeftRadius', 'paddingTop']],
  ['Detalle: nota', '#prows .pd-note', '', ['fontSize', 'borderLeftWidth', 'paddingLeft']],
];

// Piezas de Agenda. Los selectores existen en el boceto y en la app; el turno «próximo» y el «hecho» salen de la hora real.
export const PIEZAS_AGENDA = [
  ['Tarjeta del calendario', '#s-agenda .card.cal', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Encabezado de días', '#s-agenda .days', '', ['gridTemplateColumns', 'borderBottomWidth']],
  ['Día de hoy', '#s-agenda .days .today b', '', ['fontSize', 'backgroundColor', 'borderTopLeftRadius', 'paddingLeft']],
  ['Cantidad de consultas', '#s-agenda .days small', '', ['fontSize', 'color']],
  ['Columna de hoy', '#s-agenda .hcol.today', '', ['backgroundColor', 'borderLeftWidth']],
  ['Hora', '#s-agenda .hlab span', '', ['fontSize', 'color']],
  ['Turno de consultorio', '#s-agenda .ev.c', '', ['backgroundColor', 'borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'fontSize']],
  ['Turno de videollamada', '#s-agenda .ev.v', '', ['backgroundColor', 'borderTopLeftRadius']],
  ['Turno sin confirmar', '#s-agenda .ev.w', '', ['backgroundColor', 'borderTopLeftRadius']],
  ['Turno hecho', '#s-agenda .ev.d', '', ['backgroundColor', 'color']],
  ['Turno próximo', '#s-agenda .ev.n', '', ['backgroundColor', 'color']],
  ['Nombre del turno', '#s-agenda .ev b', '', ['fontSize', 'fontWeight']],
  ['Línea de ahora', '#s-agenda .nowl', '', ['borderTopWidth', 'borderTopColor']],
  ['Mes chico: día de hoy', '#s-agenda #mg .td', '', ['backgroundColor', 'fontWeight', 'borderTopLeftRadius']],
  ['Mes chico: semana', '#s-agenda #mg .wk', '', ['backgroundColor']],
  ['Referencias de color', '#s-agenda .lgd span', '', ['fontSize', 'color']],
  ['Tarjeta de pedidos', '#s-agenda .card.req', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Avatar del pedido', '#s-agenda .req .av', '', ['width', 'height', 'fontSize', 'borderTopLeftRadius']],
  ['Aceptar', '#s-agenda .req .sbtn.k', '', ['backgroundColor', 'color', 'fontSize', 'borderTopLeftRadius', 'paddingLeft']],
  ['Proponer otro', '#s-agenda .req .sbtn:not(.k)', '', ['backgroundColor', 'fontSize', 'borderTopLeftRadius']],
  ['Lugar libre', '#s-agenda .slot button', '', ['fontSize', 'borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'backgroundColor']],
];

// Piezas de Seguimiento. El selector existe en el boceto y en la app.
export const PIEZAS_SEGUIMIENTO = [
  ['Foto de la comida', '#s-seguimiento .sxpic', '', ['width', 'height', 'borderTopLeftRadius']],
  ['Nombre de la comida', '#s-seguimiento .sxwho b', '', ['fontSize', 'fontWeight', 'fontFamily']],
  ['Acciones de la comida', '#s-seguimiento .sxacts .chip', '', ['fontSize', 'borderTopLeftRadius']],
  ['Día registrado', '#s-seguimiento .sxdays i', '', ['width', 'height', 'borderTopLeftRadius']],
  ['Día con carga', '#s-seguimiento .sxdays i.on', '', ['backgroundColor']],
];

async function medir(pagina, selector, pseudo, props) {
  const cajas = pagina.locator(selector);
  const cantidad = await cajas.count();
  if (!cantidad) return null;
  // Hay una copia por pantalla y varias están ocultas. Se mide la que se ve.
  let indice = 0;
  for (let i = 0; i < cantidad; i++) {
    const caja = await cajas.nth(i).boundingBox();
    if (caja && (caja.width > 0 || caja.height > 0)) { indice = i; break; }
  }
  const caja = cajas.nth(indice);
  return caja.evaluate((el, [p, ps]) => {
    const css = getComputedStyle(el, p || undefined);
    const box = el.getBoundingClientRect();
    const tam = { width: box.width, height: box.height };
    return Object.fromEntries(ps.map(k => [k, (!p && (k === 'width' || k === 'height')) ? `${Math.round(tam[k] * 10) / 10}px` : css[k]]));
  }, [pseudo, props]);
}

async function abrirBoceto(browser, tema) {
  const pagina = await (await browser.newContext({ viewport: { width: 1500, height: 1000 }, colorScheme: tema })).newPage();
  await pagina.goto(boceto); await pagina.waitForTimeout(800);
  await pagina.locator(tema === 'dark' ? '#t-dark' : '#t-light').first().click().catch(() => {});
  await pagina.waitForTimeout(200);
  // El boceto se muestra a escala: se lleva a 1:1 para medir tamaños reales.
  await pagina.evaluate(() => {
    const stage = document.getElementById('stage');
    const wrap = document.getElementById('wrap');
    if (stage) stage.style.transform = 'none';
    if (wrap) wrap.style.height = '900px';
  });
  // Al abrir, el boceto deja Planes adelante y esconde Inicio. El armazón se mide en Inicio, que es la pantalla visible del menú.
  await pagina.locator('.bar [data-go="inicio"]').first().click();
  await pagina.waitForTimeout(200);
  await pagina.waitForSelector('#s-inicio:not([hidden]) .top .ibtn[aria-label="Avisos"]', { timeout: 10000 });
  return pagina;
}

const numero = valor => (/^-?[\d.]+px$/.test(valor) ? parseFloat(valor) : null);
function igual(a, b) {
  if (a === b) return true;
  const x = numero(a); const y = numero(b);
  return x !== null && y !== null && Math.abs(x - y) <= TOLERANCIA_PX;
}

async function abrirApp(browser, tema) {
  const pagina = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: tema })).newPage();
  await pagina.addInitScript(guardado => localStorage.setItem('plan-v:panel-theme-v2:demo', guardado), tema);
  // La línea de ahora de la Agenda solo se dibuja en horario de atención; el boceto la tiene siempre (10:10). Se fija la hora para que el contrato no dependa del reloj.
  await pagina.clock.install({ time: new Date(`${new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())}T13:10:00Z`) });
  await pagina.goto(`${origen}/crm/inicio`, { waitUntil: 'domcontentloaded' });
  const demo = pagina.getByText('Continuar en modo demo');
  if (await demo.count()) await demo.first().click();
  await pagina.waitForSelector('#pv-panel-v29', { timeout: 60000 });
  const actual = await pagina.locator('#pv-panel-v29').getAttribute('data-theme');
  if (actual !== tema) {
    await pagina.locator('.side .acct').click();
    await pagina.locator('#pv-account').getByRole('button', { name: tema === 'light' ? 'Tema claro' : 'Tema oscuro' }).click();
    await pagina.waitForFunction(esperado => document.querySelector('#pv-panel-v29')?.getAttribute('data-theme') === esperado, tema);
  }
  await pagina.waitForSelector('#pv-panel-v29 .top .cta', { timeout: 15000 });
  await pagina.waitForSelector('#pv-panel-v29 .top .ibtn', { timeout: 15000 });
  await pagina.waitForTimeout(400);
  return pagina;
}

async function comparar(bocetoPagina, appPagina, piezas, informe) {
  let fallas = 0;
  for (const [nombre, sel, pseudo, props] of piezas) {
    const [fuente, app] = [await medir(bocetoPagina, sel, pseudo, props), await medir(appPagina, sel, pseudo, props)];
    if (!fuente) {
      fallas += 1;
      informe.push(`| ${nombre} | ❌ falta | no está en el boceto v29 (\`${sel}\`) |`);
      continue;
    }
    if (!app) {
      fallas += 1;
      informe.push(`| ${nombre} | ❌ falta | la app no la tiene (\`${sel}\`) |`);
      continue;
    }
    const distintas = props.filter(k => !igual(fuente[k], app[k]));
    if (!distintas.length) { informe.push(`| ${nombre} | ✅ igual | |`); continue; }
    fallas += 1;
    informe.push(`| ${nombre} | ❌ distinta | ${distintas.map(k => `**${k}**: boceto \`${fuente[k]}\` · app \`${app[k]}\``).join('<br>')} |`);
  }
  return fallas;
}

async function abrirPacientesBoceto(pagina) {
  await pagina.locator('[data-go="pacientes"]').first().click();
  await pagina.waitForSelector('#s-pacientes:not([hidden]) #prows tr.open', { timeout: 10000 });
  await pagina.waitForTimeout(1800);
}

async function abrirPacientesApp(pagina) {
  await pagina.locator('#pv-panel-v29 a[href="/crm/pacientes"]').first().click();
  await pagina.waitForSelector('#s-pacientes #prows tr[data-i]', { timeout: 20000 });
  await pagina.locator('#prows tr[data-i]').first().click();
  await pagina.waitForSelector('#prows .pdin', { timeout: 10000 });
  await pagina.waitForTimeout(1800);
}

async function abrirAgendaBoceto(pagina) {
  await pagina.locator('[data-go="agenda"]').first().click();
  await pagina.waitForSelector('#s-agenda:not([hidden]) .ev', { timeout: 10000 });
  await pagina.waitForTimeout(800);
}

async function abrirAgendaApp(pagina) {
  await usarAgendaDeEjemplo(pagina);
  await pagina.locator('#pv-panel-v29 a[href="/crm/agenda"]').first().click();
  await pagina.waitForSelector('#s-agenda .card.cal .days', { timeout: 20000 });
  await pagina.waitForSelector('#s-agenda .ev', { timeout: 20000 });
  await pagina.waitForTimeout(800);
}

async function abrirFichaBoceto(pagina) {
  await pagina.evaluate(() => globalThis.go('ficha'));
  await pagina.waitForSelector('#s-ficha:not([hidden]) .fx .fxtile', { timeout: 10000 });
  await pagina.waitForTimeout(1500);
}

async function abrirFichaApp(pagina) {
  await pagina.locator('#pv-panel-v29 a[href="/crm/pacientes"]').first().click();
  await pagina.waitForSelector('#s-pacientes #prows tr[data-i]', { timeout: 20000 });
  await pagina.locator('#prows tr[data-i]').first().click();
  await pagina.waitForSelector('#prows .pdin', { timeout: 10000 });
  await pagina.locator('#prows .pd-acts .go').first().click();
  await pagina.waitForSelector('#s-ficha .fx .fxtile', { timeout: 20000 });
  await pagina.waitForTimeout(1500);
}

async function abrirSeguimientoBoceto(pagina) {
  await pagina.locator('[data-go="seguimiento"]').first().click();
  await pagina.waitForSelector('#s-seguimiento:not([hidden]) .sxpic', { timeout: 10000 });
  await pagina.waitForSelector('#s-seguimiento .sxdays i.on', { timeout: 10000 });
}

async function abrirSeguimientoApp(pagina) {
  await pagina.locator('#pv-panel-v29 a.nv[href="/crm/seguimiento"]').click();
  await pagina.waitForSelector('#s-seguimiento .sxpic', { timeout: 20000 });
  await pagina.waitForSelector('#s-seguimiento .sxdays i.on', { timeout: 20000 });
}

async function abrirProgresoBoceto(pagina) {
  await pagina.locator('[data-go="progreso"]').first().click();
  await pagina.waitForSelector('#s-progreso:not([hidden]) .fxr .av', { timeout: 10000 });
  await pagina.waitForSelector('#sxevo .fxdk', { timeout: 10000 });
}

async function abrirProgresoApp(pagina) {
  await pagina.locator('#pv-panel-v29 a.nv[href="/crm/progreso-global"]').click();
  await pagina.waitForSelector('#s-progreso .fxr .av', { timeout: 20000 });
  await pagina.waitForSelector('#sxevo .fxdk', { timeout: 20000 });
}

async function abrirAsistenteBoceto(pagina) {
  await pagina.locator('[data-go="asistente"]').first().click();
  await pagina.waitForSelector('#s-asistente:not([hidden]) .sxask textarea', { timeout: 10000 });
  await pagina.waitForSelector('#s-asistente .fxdk', { timeout: 10000 });
  await pagina.waitForSelector('#sxchat .sxfrom', { timeout: 10000 });
  await pagina.waitForSelector('#s-asistente .fxr .av', { timeout: 10000 });
}

async function letraDisponible(pagina) {
  return pagina.evaluate(async () => {
    await document.fonts.ready;
    const pesos = [300, 400, 500, 600];
    const faltan = pesos.filter(peso => !document.fonts.check(`${peso} 16px Inter`));
    const familia = selector => {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el).fontFamily : '';
    };
    return {
      faltan,
      titulo: familia('.top h1'),
      menu: familia('.nv.on'),
      cuerpo: familia('#s-asistente .sxask textarea'),
    };
  });
}

function letraCoincide(letra) {
  const familias = [letra.titulo, letra.menu, letra.cuerpo];
  const sinInter = familias.filter(familia => !familia.includes('Inter'));
  const conPoppins = familias.filter(familia => /Poppins|DM Sans|Fraunces/i.test(familia));
  return { sinInter, conPoppins, faltan: letra.faltan };
}

async function abrirAlimentosBoceto(pagina) {
  await pagina.locator('[data-go="alimentos"]').first().click();
  await pagina.waitForSelector('#s-alimentos:not([hidden]) .sxmac', { timeout: 10000 });
  await pagina.waitForSelector('#s-alimentos .fxdk', { timeout: 10000 });
  await pagina.waitForSelector('#s-alimentos .top .sxin', { timeout: 10000 });
}

async function abrirAlimentosApp(pagina) {
  await pagina.locator('#pv-panel-v29 a.nv[href="/crm/alimentos"]').click();
  await pagina.waitForSelector('#s-alimentos .sxmac', { timeout: 20000 });
  await pagina.waitForSelector('#s-alimentos .fxdk', { timeout: 20000 });
  await pagina.waitForSelector('.top .sxin input', { timeout: 20000 });
}

/** Responde con un laboratorio de ejemplo y el permiso de estudios, porque la demo no trae ninguno. */
async function simularLaboratorio(pagina) {
  const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const valores = [['Ferritina', 'ng/ml', '30 - 200', [9, 11, 14]], ['Hemoglobina', 'g/dl', '12 - 16', [11.4, 11.9, 12.3]], ['Glucemia', 'mg/dl', '70 - 100', [90, 88, 86]], ['Colesterol total', 'mg/dl', '< 200', [195, 188, 182]]];
  const fechas = ['2024-07-15', '2026-03-20', '2026-10-12'];
  const documentos = fechas.map((f, k) => ({ id: uid(100 + k), patient_id: 'x', filename: `Laboratorio ${k + 1}.pdf`, mime: 'application/pdf', source_sha256: 'a'.repeat(64), asset_id: 'z', created_at: `${f}T10:00:00Z` }));
  await pagina.route(/\/api\/patients\/[^/]+\/care\?audience=pro/, async ruta => {
    const respuesta = await ruta.fetch();
    const cuerpo = await respuesta.json();
    cuerpo.consented = [...new Set([...(cuerpo.consented ?? []), 'clinical_document', 'care_relationship', 'measurement'])];
    const paciente = ruta.request().url().match(/patients\/([^/]+)\/care/)[1];
    cuerpo.records = [...(cuerpo.records ?? []), { id: uid(900), patient_id: paciente, recorded_on: '2026-10-27', created_at: '2026-10-27T10:00:00Z', reviewed_at: null, data: { kind: 'menu_request', target: 'cena del jueves', reason: 'tengo poco tiempo esa noche', replacement: 'recipe' } }];
    await ruta.fulfill({ response: respuesta, json: cuerpo });
  });
  await pagina.route(/\/api\/patients\/([^/]+)\/clinical-workspace$/, async ruta => {
    const id = ruta.request().url().match(/patients\/([^/]+)\//)[1];
    const records = fechas.map((f, k) => ({ id: uid(200 + k), patient_id: id, recorded_on: f, created_at: `${f}T10:00:00Z`, note: '', reviewed: true, data: { kind: 'laboratory', document_id: documentos[k].id, values: valores.map(([n, u, ref, v], i) => ({ id: uid(300 + k * 20 + i), name: n, value: v[k], operator: '', unit: u, range_text: ref, raw_value: String(v[k]).replace('.', ','), source_line: n, page: 1, reviewed: true })) } }));
    await ruta.fulfill({ json: { records, documents: documentos.map(d => ({ ...d, patient_id: id })), references: [], brand: null } });
  });
}

/** Responde con una historia de ejemplo (el permiso de atención lo pone `simularLaboratorio`) (con altas, ediciones y bajas), porque la demo no trae ninguna. */
export async function simularHistoria(pagina) {
  const dato = (n, topic, text, recorded_on, extra = {}) => ({ id: `00000000-0000-4000-8000-${String(900 + n).padStart(12, '0')}`, topic, text, since: '', source: 'professional', recorded_on, edited_on: null, ended_on: null, ended_reason: '', ...extra });
  let entries = [
    dato(1, 'motivo', 'Bajar grasa y tener más energía. Probó dietas estrictas y las dejó al mes.', '2026-03-12'),
    dato(2, 'diag', 'Celiaquía, con biopsia', '2026-03-12', { since: 'desde 2019' }), dato(3, 'diag', 'Hipotiroidismo compensado', '2026-03-12', { since: 'desde 2021' }),
    dato(4, 'med', 'Levotiroxina 25 µg en ayunas', '2025-06-10', { source: 'import', ended_on: '2026-03-12', ended_reason: 'la endocrinóloga subió la dosis' }),
    dato(5, 'med', 'Levotiroxina 50 µg en ayunas', '2026-03-12', { since: 'desde marzo 2026' }), dato(6, 'med', 'Hierro, 1 por día', '2026-10-14', { since: 'desde el 20/08/26', source: 'recording' }),
    dato(7, 'alerg', 'Gluten (celiaquía)', '2026-03-12', { since: 'desde 2019' }), dato(8, 'r24', 'Mate solo · tostadas sin TACC con queso · ensalada con pollo', '2026-10-12', { source: 'patient' }),
  ];
  const hoy = new Date().toISOString().slice(0, 10);
  await pagina.route(/\/api\/crm\/patients\/[^/]+\/history(\/.*)?$/, async ruta => {
    const pedido = ruta.request();
    const partes = new URL(pedido.url()).pathname.split('/');
    const alta = partes[partes.length - 1] === 'end' ? partes[partes.length - 2] : partes[partes.length - 1] !== 'history' ? partes[partes.length - 1] : null;
    const cuerpo = pedido.postData() ? JSON.parse(pedido.postData()) : {};
    if (pedido.method() === 'POST' && !alta) entries = [...entries, dato(entries.length + 1, cuerpo.topic, cuerpo.text, hoy, { since: cuerpo.since ?? '' })];
    else if (pedido.method() === 'PATCH') entries = entries.map(e => e.id === alta ? { ...e, text: cuerpo.text, edited_on: hoy } : e);
    else if (pedido.method() === 'POST') entries = entries.map(e => e.id === alta ? { ...e, ended_on: hoy, ended_reason: cuerpo.reason ?? '' } : e);
    await ruta.fulfill({ json: { entries } });
  });
}

async function abrirAsistenteApp(pagina) {
  await pagina.locator('#pv-panel-v29 a.nv[href="/crm/desarrollo?modulo=asistente-ia"]').click();
  await pagina.waitForSelector('#s-asistente .sxask textarea', { timeout: 20000 });
  await pagina.waitForSelector('#s-asistente .fxdk', { timeout: 20000 });
  await pagina.waitForSelector('#sxchat .sxfrom', { timeout: 20000 });
  await pagina.waitForSelector('#s-asistente .fxr .av', { timeout: 20000 });
}

export async function correrContratoV29() {
  const informe = [];
  let fallas = 0;
  const { chromium } = playwright();
  const navegador = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined),
    args: ['--headless=new'],
    ignoreDefaultArgs: ['--headless=old'],
  });
  try {
    for (const tema of ['dark', 'light']) {
      const b = await abrirBoceto(navegador, tema);
      const a = await abrirApp(navegador, tema);
      await simularLaboratorio(a);
      await simularHistoria(a);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · armazón\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_V29, informe);
      await a.waitForSelector('#s-inicio .kpis', { timeout: 20000 });
      await a.waitForSelector('#det .xhero', { timeout: 20000 });
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Inicio\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_INICIO, informe);
      await abrirPacientesBoceto(b);
      await abrirPacientesApp(a);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Pacientes\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_PACIENTES, informe);
      await abrirAgendaBoceto(b);
      await abrirAgendaApp(a);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Agenda\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_AGENDA, informe);
      await abrirFichaBoceto(b);
      await abrirFichaApp(a);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Ficha\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_FICHA, informe);
      await b.locator('#ftabs [data-ft="mediciones"]').click();
      await a.locator('#ftabs button').filter({ hasText: /^Mediciones$/ }).click();
      await a.waitForSelector('#s-ficha .fxgauges', { timeout: 20000 });
      await b.waitForTimeout(1200);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Ficha · Mediciones\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_MEDICIONES, informe);
      await b.locator('#ftabs [data-ft="laboratorio"]').click();
      await a.locator('#ftabs button').filter({ hasText: /^Laboratorio y estudios/ }).click();
      await a.waitForSelector('#s-ficha .lbt tbody td.out', { timeout: 20000 });
      await b.waitForTimeout(1200);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Ficha · Laboratorio\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_LABORATORIO, informe);
      await b.locator('#ftabs [data-ft="historia"]').click();
      await a.locator('#ftabs button').filter({ hasText: /^Historia clínica/ }).click();
      await a.waitForSelector('#s-ficha .hcidx', { timeout: 20000 });
      await a.waitForSelector('#s-ficha .hcpast', { timeout: 20000 }).catch(() => undefined);
      await b.waitForTimeout(1200);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Ficha · Historia clínica\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_HISTORIA, informe);
      await b.locator('#ftabs [data-ft="objetivos"]').click();
      await a.locator('#ftabs button').filter({ hasText: /^Objetivos y hábitos/ }).click();
      await a.waitForSelector('#s-ficha .fxhab', { timeout: 20000 });
      await b.waitForTimeout(1200);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Ficha · Objetivos y hábitos\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_OBJETIVOS, informe);
      await b.locator('#ftabs [data-ft="alimentario"]').click();
      await a.locator('#ftabs button').filter({ hasText: /^Registro alimentario/ }).click();
      await a.waitForSelector('#s-ficha .fxtb tbody tr', { timeout: 20000 });
      await b.waitForTimeout(1200);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Ficha · Registro alimentario\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_ALIMENTARIO, informe);
      await b.locator('#ftabs [data-ft="plan"]').click();
      await a.locator('#ftabs button').filter({ hasText: /^Plan$/ }).click();
      await a.waitForSelector('#s-ficha .fxmeals li', { timeout: 20000 });
      await a.waitForSelector('#s-ficha .fxask', { timeout: 20000 });
      await b.waitForTimeout(1200);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Ficha · Plan\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_PLAN, informe);
      await abrirSeguimientoBoceto(b);
      await abrirSeguimientoApp(a);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Seguimiento\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_SEGUIMIENTO, informe);
      await abrirProgresoBoceto(b);
      await abrirProgresoApp(a);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Progreso\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_PROGRESO, informe);
      await abrirAsistenteBoceto(b);
      await abrirAsistenteApp(a);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Asistente\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_ASISTENTE, informe);
      const [letraBoceto, letraApp] = await Promise.all([letraDisponible(b), letraDisponible(a)]);
      const fallaBoceto = letraCoincide(letraBoceto);
      const fallaApp = letraCoincide(letraApp);
      const letraOk = !fallaBoceto.faltan.length && !fallaApp.faltan.length && !fallaBoceto.sinInter.length && !fallaApp.sinInter.length && !fallaBoceto.conPoppins.length && !fallaApp.conPoppins.length;
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · letra\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      if (letraOk) informe.push('| Inter 300–600 en título, menú y cuerpo | ✅ igual | |');
      else {
        fallas += 1;
        informe.push(`| Inter 300–600 en título, menú y cuerpo | ❌ distinta | boceto faltan \`${fallaBoceto.faltan.join(',') || '—'}\` sin Inter \`${fallaBoceto.sinInter.join(' · ') || '—'}\` · app faltan \`${fallaApp.faltan.join(',') || '—'}\` sin Inter \`${fallaApp.sinInter.join(' · ') || '—'}\` Poppins \`${[...fallaBoceto.conPoppins, ...fallaApp.conPoppins].join(' · ') || '—'}\` |`);
      }
      await abrirAlimentosBoceto(b);
      await abrirAlimentosApp(a);
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Alimentos\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_ALIMENTOS, informe);
      await b.locator('[data-go="biblioteca"]').first().click();
      await b.waitForSelector('#s-biblioteca:not([hidden]) .sxcard');
      await a.locator('#pv-panel-v29 a.nv').filter({ hasText: /^Biblioteca$/ }).click();
      await a.waitForSelector('#s-biblioteca .sxcard');
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Biblioteca\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_BIBLIOTECA, informe);
      await b.locator('[data-go="planes"]').first().click();
      await b.waitForSelector('#s-planes:not([hidden])');
      await b.locator('#s-planes #pview button').first().click();
      await b.waitForSelector('#s-planes .r29-search');
      await a.locator('#pv-panel-v29 a[href="/crm/plan"]').click();
      await a.waitForSelector('#s-planes .r29-search');
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Planes\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_PLANES, informe);
      await b.locator('#s-planes .r29-table .sbtn', { hasText: 'Crear plan' }).first().click();
      await b.waitForSelector('#s-planes .pstart .sbtn.k');
      await a.locator('#s-planes .r29-table .sbtn', { hasText: 'Crear plan' }).first().click();
      await a.waitForSelector('#s-planes .pstart .sbtn.k');
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Cómo empezar el plan\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_EMPEZAR, informe);
      await b.locator('#s-planes #pview button', { hasText: 'Todos los planes' }).click();
      await b.locator('#s-planes .r29-table .sbtn', { hasText: 'Abrir plan' }).first().click();
      await b.waitForSelector('#s-planes.pux-plan .pedays button');
      await a.getByRole('button', { name: 'Empezar vacío', exact: true }).click();
      await a.waitForSelector('#s-planes.pux-plan .pedays button');
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · Editor de Planes\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_EDITOR, informe);
      await b.close();
      await a.close();
    }
  } finally { await navegador.close(); }

  const texto = `# Contrato del armazón contra el boceto v29\n\nFuente: \`design/panel-nutri/v29/panel-trabajo.html\`.\nApp: armazón, Seguimiento, Progreso, Asistente IA, Alimentos, Biblioteca y Planes (${origen}).\n\n${fallas ? `**${fallas} piezas no coinciden.**` : '**El armazón, Seguimiento, Progreso, Asistente, Alimentos, Biblioteca y Planes coinciden, en claro y en oscuro.**'}\n${informe.join('\n')}\n`;
  return { fallas, texto };
}

const esPrincipal = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (esPrincipal) {
  const { fallas, texto } = await correrContratoV29();
  console.log(texto);
  if (args.includes('--write')) await writeFile(resolve(raiz, 'design/panel-nutri/v29/contrato-informe.md'), texto);
  process.exit(fallas ? 1 : 0);
}
