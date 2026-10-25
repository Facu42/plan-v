// Mide las piezas del armazón en el boceto v29 (design/panel-nutri/v29/panel-trabajo.html).
//
// Fase 0 (tools): solo valida la FUENTE. Falla si una pieza de la lista no está en el HTML.
// No compara contra React: el armazón actual sigue con las clases viejas (`.m.desk`, `.sb`)
// y se cambia en la fase del shell. `npm run panel:contrato` (el viejo) sigue midiendo
// bocetos.html contra la app de hoy.
//
// Uso:
//   node scripts/panel-v29-contrato.mjs          → imprime el informe y sale con 1 si falta una pieza
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
  const caja = pagina.locator(selector).first();
  if (!(await caja.count())) return null;
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
  await pagina.waitForSelector('.app .side', { timeout: 10000 });
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
      informe.push(`\n## Tema ${tema === 'dark' ? 'oscuro' : 'claro'}\n`, '| Pieza | Estado | Detalle |', '|---|---|---|');
      for (const [nombre, sel, pseudo, props] of PIEZAS_V29) {
        const valores = await medir(b, sel, pseudo, props);
        if (!valores) {
          fallas += 1;
          informe.push(`| ${nombre} | ❌ falta | no está en el boceto v29 (\`${sel}\`) |`);
          continue;
        }
        const detalle = Object.entries(valores).map(([k, v]) => `${k} \`${v}\``).join(' · ');
        informe.push(`| ${nombre} | ✅ en la fuente | ${detalle} |`);
      }
      await b.close();
    }
  } finally { await navegador.close(); }

  const texto = `# Contrato del armazón contra el boceto v29\n\nFuente: \`design/panel-nutri/v29/panel-trabajo.html\`.\nEste informe **solo mira la fuente**. No compara con React: el shell actual sigue en \`.m.desk\` / \`panel-boceto.css\` hasta la fase del armazón.\n\n${fallas ? `**${fallas} piezas no están en el boceto.**` : '**Todas las piezas del armazón están en el boceto v29.**'}\n${informe.join('\n')}\n`;
  return { fallas, texto };
}

const esPrincipal = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (esPrincipal) {
  const { fallas, texto } = await correrContratoV29();
  console.log(texto);
  if (args.includes('--write')) await writeFile(resolve(raiz, 'design/panel-nutri/v29/contrato-informe.md'), texto);
  process.exit(fallas ? 1 : 0);
}
