// Compara el armazón de la nutri contra el boceto v29 (design/panel-nutri/v29/panel-trabajo.html).
//
// Mide las mismas piezas en la fuente y en la app (claro y oscuro). No compara el texto:
// compara medidas y colores resueltos. Si una pieza falta o difiere más de 0,6 px, falla.
// `npm run panel:contrato` (el viejo) sigue midiendo bocetos.html y no es el de esta fase.
//
// Uso (app en demo: `npm run local`):
//   node scripts/panel-v29-contrato.mjs          → imprime el informe y sale con 1 si algo no coincide
//   node scripts/panel-v29-contrato.mjs --write  → además lo guarda en design/panel-nutri/v29/contrato-informe.md
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

export const PIEZAS_EDITOR = [
  ['Día del editor', '#s-planes .pedays button', '', ['fontSize', 'borderTopLeftRadius', 'fontWeight']],
  ['Día activo', '#s-planes .pedays button.on', '', ['backgroundColor', 'borderTopLeftRadius']],
  ['Pestaña del editor', '#s-planes #ptabs button', '', ['fontSize', 'borderTopLeftRadius']],
  ['Pestaña Comidas', '#s-planes #ptabs button.on', '', ['backgroundColor', 'fontWeight']],
  ['Duplicar día', '#s-planes .petool .lnk', '', ['fontSize', 'fontWeight']],
  ['Contexto del plan', '#s-planes .r29-context', '', ['borderTopLeftRadius', 'minHeight']],
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
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'} · armazón\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      fallas += await comparar(b, a, PIEZAS_V29, informe);
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
      await b.locator('#s-planes .r29-table .sbtn', { hasText: 'Abrir plan' }).first().click();
      await b.waitForSelector('#s-planes.pux-plan .pedays button');
      await a.locator('#s-planes .r29-table .sbtn').first().click();
      const empezar = a.getByRole('button', { name: 'Empezar vacío', exact: true });
      if (await empezar.count()) await empezar.click();
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
