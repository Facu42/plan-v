// Compara las pantallas de la paciente contra los frames de Nutrigo, píxel por píxel.
//
// 1. `npm run local` (modo demo) y, para tener datos completos, `node --import tsx scripts/nutrigo-compare.mjs --seed`.
// 2. `node --import tsx scripts/nutrigo-compare.mjs [pantalla]` → design/nutrigo-compare/{app,diff}/ e informe.md.
//
// Las referencias son renders 1:1 de Figma en design/nutrigo-frames/<nodo>.png (MCP get_screenshot).
// La diferencia es orientativa: Plan V muestra sus propios datos y textos en español, así que nunca
// llega a 0 %. Sirve para ver qué pantallas se alejan y dónde (imagen diff en rojo).
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const require = createRequire(import.meta.url);
// Playwright viene instalado en el entorno (global), no como dependencia del proyecto.
const { chromium } = (() => { try { return require('playwright'); } catch { return require(`${process.env.PLAYWRIGHT_GLOBAL ?? '/opt/node22/lib/node_modules'}/playwright`); } })();

export const PATIENT_PAGES = [
  ['inicio', '12:792', '427:14405'], ['agenda', '84:1666', '433:17250'], ['mensajes', '84:2565', '433:19982'],
  ['recetas', '84:2716', '445:10499'], ['plan', '84:2994', '470:15300'], ['compras', '105:2472', '492:11324'],
  ['diario', '105:2649', '492:14886'], ['progreso', '105:2790', '498:18237'], ['ejercicio', '105:2931', '501:22824'],
  ['recursos', '263:6588', '504:15334'],
];
const args = process.argv.slice(2);
const origin = process.env.PLANV_ORIGIN ?? 'http://127.0.0.1:5173';
const api = process.env.PLANV_API ?? 'http://127.0.0.1:3001';
const out = resolve(process.env.PLANV_COMPARE_OUT ?? 'design/nutrigo-compare');
const frames = resolve('design/nutrigo-frames');
const only = args.find(arg => !arg.startsWith('--'));

async function seed() {
  // La API de demo ya carga el contenido al iniciar; esto sólo lo completa si faltara (no duplica).
  const { seedDemoOnBoot } = await import('../server/demo/autoseed.ts');
  const { seeded, failed } = await seedDemoOnBoot((path, init) => fetch(api + path, init));
  console.log(seeded ? `Contenido de ejemplo cargado (${failed.length} pasos con error).` : 'La demo ya tenía el contenido de ejemplo.');
  if (failed.length) console.log(failed);
}

async function enterDemo(page) {
  await page.goto(`${origin}/app/inicio`);
  const demo = page.getByRole('button', { name: /modo demo/i });
  if (await demo.count()) await demo.first().click();
  await page.waitForLoadState('networkidle');
  await page.addStyleTag({ content: '.pv-install{display:none!important}' });
}

async function capture(page, slug, file) {
  // El modo demo vive en memoria: se navega dentro de la app, sin recargar.
  await page.evaluate(path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }, `/app/${slug}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  const frame = page.locator('[data-figma-frame] > *').first();
  await frame.screenshot({ path: file });
}

function diff(referenceFile, actualFile, diffFile) {
  const reference = PNG.sync.read(require('node:fs').readFileSync(referenceFile));
  const actual = PNG.sync.read(require('node:fs').readFileSync(actualFile));
  const width = reference.width;
  const height = Math.max(reference.height, actual.height);
  const pad = image => {
    const canvas = new PNG({ width, height });
    canvas.data.fill(255);
    PNG.bitblt(image, canvas, 0, 0, Math.min(image.width, width), Math.min(image.height, height), 0, 0);
    return canvas;
  };
  const a = pad(reference), b = pad(actual), output = new PNG({ width, height });
  const changed = pixelmatch(a.data, b.data, output.data, width, height, { threshold: 0.15 });
  require('node:fs').writeFileSync(diffFile, PNG.sync.write(output));
  return { percent: (100 * changed) / (width * height), heightReference: reference.height, heightApp: actual.height };
}

if (args.includes('--seed')) await seed();
await mkdir(`${out}/app`, { recursive: true });
await mkdir(`${out}/diff`, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium' });
const rows = [];
for (const [width, suffix, column] of [[1440, 'escritorio', 1], [390, 'celular', 2]]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
  const page = await context.newPage();
  await enterDemo(page);
  for (const entry of PATIENT_PAGES) {
    const [slug] = entry; const node = entry[column];
    if (only && only !== slug) continue;
    const name = `${slug}-${suffix}`;
    const actualFile = `${out}/app/${name}.png`;
    await capture(page, slug, actualFile);
    const referenceFile = `${frames}/${node.replace(':', '-')}.png`;
    if (!existsSync(referenceFile)) { rows.push([name, node, 'sin referencia', '', '']); continue; }
    const result = diff(referenceFile, actualFile, `${out}/diff/${name}.png`);
    rows.push([name, node, `${result.percent.toFixed(1)} %`, result.heightReference, result.heightApp]);
    console.log(name, `${result.percent.toFixed(1)} %`);
  }
  await context.close();
}
await browser.close();
const previous = existsSync(`${out}/informe.md`) ? await readFile(`${out}/informe.md`, 'utf8') : '';
// Con una sola pantalla se conservan las filas de las demás del informe anterior.
if (only && previous) {
  const fresh = new Set(rows.map(row => row[0]));
  for (const line of previous.split('\n')) {
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length === 5 && !fresh.has(cells[0]) && cells[0] !== 'Pantalla' && !cells[0].startsWith('---')) rows.push(cells);
  }
  const order = PATIENT_PAGES.flatMap(([slug]) => [`${slug}-escritorio`, `${slug}-celular`]);
  rows.sort((a, b) => (a[0].endsWith('celular') - b[0].endsWith('celular')) || order.indexOf(a[0]) - order.indexOf(b[0]));
}
const table = ['| Pantalla | Nodo Figma | Píxeles distintos | Alto Figma | Alto app |', '|---|---|---|---|---|', ...rows.map(row => `| ${row.join(' | ')} |`)].join('\n');
await writeFile(`${out}/informe.md`, `# Comparación con Nutrigo\n\nGenerado por \`scripts/nutrigo-compare.mjs\` el ${new Date().toISOString().slice(0, 10)}.\nLos datos y textos de Plan V nunca dan 0 %: la cifra sirve para ver qué pantalla se aleja más.\n\n${table}\n`);
