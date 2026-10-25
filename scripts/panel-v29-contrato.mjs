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
  ['Nombre (Plan V)', '.app .logo b', '', ['fontSize', 'fontWeight', 'color']],
  ['Título de grupo (Gestión)', '.app .grp h6', '', ['fontSize', 'fontWeight', 'letterSpacing', 'textTransform', 'color']],
  ['Opción del menú', '.app .nv:not(.on)', '', ['fontSize', 'color', 'borderTopLeftRadius']],
  ['Opción activa', '.app .nv.on', '', ['backgroundColor', 'color', 'fontWeight']],
  ['Ícono de la opción', '.app .nv svg.i', '', ['width', 'height']],
  ['Contador', '.app .nv .ct', '', ['fontSize', 'backgroundColor', 'color']],
  ['Contador naranja', '.app .nv .ct.hot', '', ['backgroundColor', 'color']],
  ['Flecha de plegar', '.app .fold', '', ['width', 'height', 'borderTopLeftRadius', 'boxShadow', 'backgroundColor']],
  ['Buscador del menú', '.app .srch', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Cuenta', '.app .acct', '', ['borderTopLeftRadius', 'backgroundColor']],
  ['Columna principal', '.app .main', '', ['paddingTop', 'paddingLeft']],
  ['Título de la pantalla', '.app .top h1', '', ['fontSize', 'fontWeight', 'color']],
  ['Campana', '.app .top .ibtn', '', ['width', 'height', 'borderTopLeftRadius']],
  ['CTA', '.app .top .cta', '', ['backgroundColor', 'color']],
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
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'}\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      for (const [nombre, sel, pseudo, props] of PIEZAS_V29) {
        const [fuente, app] = [await medir(b, sel, pseudo, props), await medir(a, sel, pseudo, props)];
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
      await b.close();
      await a.close();
    }
  } finally { await navegador.close(); }

  const texto = `# Contrato del armazón contra el boceto v29\n\nFuente: \`design/panel-nutri/v29/panel-trabajo.html\`.\nApp: \`${origen}/crm/inicio\`.\n\n${fallas ? `**${fallas} piezas del armazón no coinciden.**` : '**Todas las piezas del armazón coinciden, en claro y en oscuro.**'}\n${informe.join('\n')}\n`;
  return { fallas, texto };
}

const esPrincipal = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (esPrincipal) {
  const { fallas, texto } = await correrContratoV29();
  console.log(texto);
  if (args.includes('--write')) await writeFile(resolve(raiz, 'design/panel-nutri/v29/contrato-informe.md'), texto);
  process.exit(fallas ? 1 : 0);
}
