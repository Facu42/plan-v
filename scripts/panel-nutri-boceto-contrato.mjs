// Compara el panel de la nutri contra el boceto aprobado (design/panel-nutri/bocetos.html).
//
// No compara píxeles (los datos de la demo no son los del boceto): compara los ESTILOS RESUELTOS de las
// piezas que no dependen de datos (menú lateral, flecha de plegar, submenú, contadores, títulos) en claro
// y oscuro. Si una medida, un color, una sombra o una línea del árbol no es igual, la pieza falla.
//
// Uso (app corriendo en demo: `npm run local`):
//   node scripts/panel-nutri-boceto-contrato.mjs            → imprime el informe y sale con 1 si algo no coincide
//   node scripts/panel-nutri-boceto-contrato.mjs --write    → además lo guarda en design/panel-nutri/contrato-informe.md
//   node scripts/panel-nutri-boceto-contrato.mjs --shots    → además guarda capturas boceto|app en design/panel-nutri/contrato/
//
// Para sumar una pieza, agregá una fila a PIEZAS. Lo que el boceto dibuja y la app no, aparece como «falta».
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { try { return require('playwright-core'); } catch { return require(`${process.env.PLAYWRIGHT_GLOBAL ?? '/opt/node22/lib/node_modules'}/playwright`); } } })();

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const origen = process.env.PLANV_ORIGIN ?? 'http://127.0.0.1:5173';
const boceto = `file://${raiz}/design/panel-nutri/bocetos.html`;
const TOLERANCIA_PX = 0.6;

const CAJA = ['width', 'height', 'borderTopLeftRadius', 'paddingTop', 'paddingLeft', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'boxShadow'];
const PSEUDO = ['width', 'height', 'left', 'borderLeftWidth', 'borderBottomWidth', 'borderBottomLeftRadius', 'borderLeftColor', 'borderBottomColor'];

// [nombre, selector (boceto y app), pseudo-elemento o '', propiedades, estado]
// estado 'hover' o 'active' mide la pieza con el mouse encima o apretada (solo `transform`).
// Desde la fase A la app usa las mismas clases que el boceto, así que el selector es el mismo en los dos.
export const PIEZAS = [
  ['Menú lateral · ancho', '.m.desk .sb', '', ['width']],
  ['Logo', '.m .brand img', '', ['width', 'height', 'borderTopLeftRadius']],
  ['Nombre (Plan V)', '.m .brand b', '', ['fontSize', 'fontWeight', 'color']],
  ['Título de grupo (GESTIÓN)', '.m .gl', '', ['fontSize', 'fontWeight', 'letterSpacing', 'textTransform', 'color', 'marginTop']],
  ['Opción del menú', '.m .ni:not(.on)', '', ['height', 'borderTopLeftRadius', 'paddingLeft', 'fontSize', 'color']],
  ['Opción activa', '.m .ni.on', '', ['backgroundColor', 'borderTopLeftRadius', 'height', 'color', 'fontWeight']],
  ['Ícono de la opción', '.m .ni svg', '', ['width', 'height']],
  ['Contador naranja', '.m .ni .n', '', ['height', 'fontSize', 'fontWeight', 'backgroundColor', 'color']],
  ['Flecha del submenú', '.m .ni .nx', '', ['width', 'height', 'borderTopLeftRadius', 'color']],
  ['Flecha de plegar', '.m .sbt', '', ['width', 'height', 'borderTopLeftRadius', 'boxShadow', 'backgroundColor', 'borderTopColor', 'top', 'right']],
  ['Flecha · ícono', '.m .sbt svg', '', ['width', 'height']],
  ['Flecha · al pasar el mouse', '.m .sbt', '', ['transform', 'backgroundColor'], 'hover'],
  ['Flecha · al apretar', '.m .sbt', '', ['transform'], 'active'],
  ['Opción del submenú', '.m .ng.open .si', '', ['fontSize', 'height', 'paddingTop', 'paddingLeft', 'borderTopLeftRadius', 'color']],
  ['Submenú · codo del árbol', '.m .ng.open .si', '::before', PSEUDO],
  ['Submenú · línea que sigue', '.m .ng.open .si:not(:last-child)', '::after', ['left', 'borderLeftWidth', 'borderLeftColor']],
  ['Contador del submenú', '.m .ng.open .si b', '', ['minWidth', 'height', 'borderTopLeftRadius', 'fontSize', 'fontWeight', 'backgroundColor', 'color']],
  ['Cuenta', '.m .me', '', ['paddingTop', 'borderTopLeftRadius', 'backgroundColor', 'paddingLeft']],
  ['Columna principal', '.m .main', '', ['paddingTop', 'paddingLeft', 'rowGap', 'backgroundColor']],
  ['Título de la pantalla', '.m .hdr h1', '', ['fontSize', 'fontWeight', 'color', 'letterSpacing']],
  ['Buscador', '.m .hdr .search', '', ['height', 'borderTopLeftRadius', 'backgroundColor', 'borderTopColor', 'color']],
  ['Campana', '.m .hdr .ibtn', '', ['width', 'height', 'borderTopLeftRadius', 'backgroundColor']],
];

async function medir(pagina, selector, pseudo, props, estado) {
  const caja = await pagina.locator(selector).first();
  if (!(await caja.count())) return null;
  if (estado === 'hover') await caja.hover();
  if (estado === 'active') { await caja.hover(); await pagina.mouse.down(); }
  await pagina.waitForTimeout(estado ? 450 : 0);
  const valores = await caja.evaluate((el, [p, ps]) => {
    const css = getComputedStyle(el, p || undefined);
    const caja = el.getBoundingClientRect();
    const tam = { width: caja.width, height: caja.height };
    return Object.fromEntries(ps.map(k => [k, (!p && k in tam && css[k] === 'auto') || (!p && (k === 'width' || k === 'height')) ? `${Math.round(tam[k] * 10) / 10}px` : css[k]]));
  }, [pseudo, props]);
  // Se suelta lejos de la pieza para no activarla (la flecha plegaría el menú).
  if (estado) await pagina.mouse.move(0, 0);
  if (estado === 'active') await pagina.mouse.up();
  return valores;
}

const numero = v => (/^-?[\d.]+px$/.test(v) ? parseFloat(v) : null);
function igual(a, b) {
  if (a === b) return true;
  const x = numero(a); const y = numero(b);
  return x !== null && y !== null && Math.abs(x - y) <= TOLERANCIA_PX;
}

async function abrirBoceto(browser, tema) {
  const pagina = await (await browser.newContext({ viewport: { width: 1500, height: 1000 }, colorScheme: tema })).newPage();
  await pagina.goto(boceto); await pagina.waitForTimeout(1200);
  await pagina.locator(`[data-theme-set="${tema}"]`).first().click().catch(() => {});
  await pagina.locator('.m [data-go="pacientes"]').first().click(); await pagina.waitForTimeout(700);
  // El boceto se muestra a escala: se lleva a 1:1 para medir tamaños reales.
  await pagina.evaluate(() => { const c = document.getElementById('canvas'); if (c) c.style.transform = 'none'; });
  return pagina;
}

async function abrirApp(browser, tema) {
  const pagina = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: tema })).newPage();
  // El modo demo vive en memoria: el tema se deja guardado antes de cargar y no se recarga después.
  await pagina.addInitScript(t => localStorage.setItem('plan-v:panel-theme-v2:demo', t), tema);
  await pagina.goto(`${origen}/crm/pacientes`, { waitUntil: 'networkidle' });
  const demo = pagina.getByText('Continuar en modo demo');
  if (await demo.count()) await demo.first().click();
  await pagina.waitForSelector('#pv-panel', { timeout: 60000 });
  await pagina.waitForTimeout(1500);
  return pagina;
}

const informe = [];
let fallas = 0;
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (await import('node:fs')).existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--headless=new'], ignoreDefaultArgs: ['--headless=old'] });
try {
  for (const tema of ['dark', 'light']) {
    const [b, a] = [await abrirBoceto(navegador, tema), await abrirApp(navegador, tema)];
    informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'}\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
    for (const [nombre, selB, pseudo, props, estado] of PIEZAS) {
      const selA = selB;
      const [vb, va] = [await medir(b, selB, pseudo, props, estado), await medir(a, selA, pseudo, props, estado)];
      if (!vb) { informe.push(`| ${nombre} | ⚠️ revisar | no se encontró en el boceto (\`${selB}\`) |`); continue; }
      if (!va) { fallas += 1; informe.push(`| ${nombre} | ❌ falta | la app no la tiene (\`${selA}\`) |`); continue; }
      const malas = props.filter(k => !igual(vb[k], va[k]));
      if (!malas.length) { informe.push(`| ${nombre} | ✅ igual | |`); continue; }
      fallas += 1;
      informe.push(`| ${nombre} | ❌ distinta | ${malas.map(k => `**${k}**: boceto \`${vb[k]}\` · app \`${va[k]}\``).join('<br>')} |`);
    }
    if (args.includes('--shots')) {
      const carpeta = resolve(raiz, 'design/panel-nutri/contrato'); await mkdir(carpeta, { recursive: true });
      await b.locator('.m .sb').first().screenshot({ path: `${carpeta}/menu-boceto-${tema}.png` });
      await a.locator('.m .sb').first().screenshot({ path: `${carpeta}/menu-app-${tema}.png` });
    }
  }
} finally { await navegador.close(); }

const texto = `# Contrato del panel de la nutri contra el boceto\n\nGenerado con \`scripts/panel-nutri-boceto-contrato.mjs\`. ${fallas ? `**${fallas} piezas no coinciden.**` : '**Todas las piezas coinciden.**'}\n${informe.join('\n')}\n`;
console.log(texto);
if (args.includes('--write')) await writeFile(resolve(raiz, 'design/panel-nutri/contrato-informe.md'), texto);
process.exit(fallas ? 1 : 0);
