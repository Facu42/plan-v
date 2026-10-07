// Auditoría de pantallas y diálogos de la paciente en la demo local (estructura browser-qa de ECC,
// adaptada a Plan V: español, solo 1440 y 390, solo demo local, sin tocar producción).
//
//   npm run local                       # demo con datos de ejemplo cargados al iniciar
//   node scripts/nutrigo-audit.mjs      # → design/auditoria/{capturas}/ e informe.md
//
// Por cada página abre cada control (botones de ícono incluidos). Si aparece un diálogo, lo captura y
// revisa: desborde, campos montados, nombre accesible, foco, Escape y texto en inglés. Las páginas que
// no están en el archivo de Figma se juzgan contra los tokens de design/nutrigo-fidelity.md.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require(`${process.env.PLAYWRIGHT_GLOBAL ?? '/opt/node22/lib/node_modules'}/playwright`); } })();

const origin = process.env.PLANV_ORIGIN ?? 'http://127.0.0.1:5173';
const out = resolve(process.env.PLANV_AUDIT_OUT ?? 'design/auditoria');
const PAGES = ['inicio', 'agenda', 'mensajes', 'recetas', 'plan', 'compras', 'diario', 'progreso', 'ejercicio', 'recursos', 'ficha', 'pagos'];
const VIEWPORTS = [[1440, 900, 'escritorio'], [390, 844, 'celular']];
const MAX_CONTROLS = Number(process.env.PLANV_AUDIT_MAX ?? 30);
const ENGLISH = /\b(Add|Edit|Remove|Delete|Save|Cancel|Loading|Search|Submit|Close|Next|Previous|Today|Settings|Profile)\b/;
const only = process.argv[2];

async function enterDemo(page) {
  await page.goto(`${origin}/app/inicio`);
  const demo = page.getByRole('button', { name: /modo demo/i });
  if (await demo.count()) await demo.first().click();
  await page.waitForLoadState('networkidle');
  await page.addStyleTag({ content: '.pv-install{display:none!important}' });
}
const go = async (page, slug) => {
  await page.evaluate(p => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')); }, `/app/${slug}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
};

/** Marca los controles que se pueden tocar y devuelve su nombre. Excluye el menú lateral y la barra superior. */
const listControls = page => page.evaluate(max => {
  const seen = new Set(); const found = [];
  const skip = el => el.closest('nav, [data-name="Navbar"], [data-name="Header Menu"], [data-name="Button Nav"], [role="dialog"], .mcp-nutrigo > header');
  for (const el of document.querySelectorAll('button, [role="button"]')) {
    if (el.disabled || skip(el) || !el.getClientRects().length) continue;
    const label = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    if (!label || seen.has(label)) continue;
    seen.add(label); el.setAttribute('data-audit', String(found.length)); found.push(label);
    if (found.length >= max) break;
  }
  return found;
}, MAX_CONTROLS);

/** Revisiones de un diálogo abierto (se ejecutan dentro de la página). */
const inspectDialog = (page, english) => page.evaluate(englishSource => {
  const english = new RegExp(englishSource);
  const dialog = document.querySelector('[role="dialog"], dialog[open], .fp-record-dialog, .photo-modal, [aria-modal="true"]');
  if (!dialog) return null;
  const box = dialog.getBoundingClientRect(); const issues = [];
  const name = dialog.getAttribute('aria-label') || (dialog.getAttribute('aria-labelledby') ? document.getElementById(dialog.getAttribute('aria-labelledby'))?.textContent : '') || dialog.querySelector('h1,h2,h3')?.textContent || '';
  if (!name.trim()) issues.push('El diálogo no tiene nombre accesible (aria-label o título).');
  if (dialog.scrollWidth > dialog.clientWidth + 2) issues.push(`Desborde horizontal dentro del diálogo (${dialog.scrollWidth} px en ${dialog.clientWidth} px).`);
  if (document.documentElement.scrollWidth > innerWidth + 2) issues.push('La página tiene scroll horizontal con el diálogo abierto.');
  const fields = [...dialog.querySelectorAll('input:not([type=hidden]), select, textarea, button')].filter(el => el.getClientRects().length);
  const rects = fields.filter(el => el.type !== 'file' && getComputedStyle(el).opacity !== '0' && el.getBoundingClientRect().width > 8 && el.getBoundingClientRect().height > 8).map(el => ({ el, r: el.getBoundingClientRect() }));
  for (const { el, r } of rects) {
    if (r.right > box.right + 2 || r.left < box.left - 2) issues.push(`«${(el.getAttribute('aria-label') || el.name || el.textContent || el.tagName).trim().slice(0, 30)}» se sale del diálogo por los costados.`);
  }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (w > 4 && h > 4) issues.push(`Se montan «${(a.el.getAttribute('aria-label') || a.el.name || a.el.textContent || a.el.tagName).trim().slice(0, 24)}» y «${(b.el.getAttribute('aria-label') || b.el.name || b.el.textContent || b.el.tagName).trim().slice(0, 24)}».`);
  }
  for (const el of dialog.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea')) {
    if (!el.getClientRects().length) continue;
    const labelled = el.getAttribute('aria-label') || el.labels?.length || el.getAttribute('aria-labelledby');
    if (!labelled) issues.push(`Un campo (${el.tagName.toLowerCase()}${el.name ? ' ' + el.name : ''}) no tiene etiqueta.`);
  }
  const fonts = new Set([...dialog.querySelectorAll('*')].slice(0, 400).map(el => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()));
  const offBrand = [...fonts].filter(f => f && !/^Poppins/i.test(f) && !/^(sans-serif|monospace)$/i.test(f));
  if (offBrand.length) issues.push(`Tipografía fuera de Nutrigo (Poppins): ${offBrand.join(', ')}.`);
  const text = dialog.innerText || '';
  const m = text.match(english); if (m) issues.push(`Posible texto en inglés: «${m[0]}».`);
  if (!dialog.contains(document.activeElement)) issues.push('El foco no entró al diálogo al abrirlo.');
  return { name: name.trim().slice(0, 60), issues: [...new Set(issues)] };
}, english.source);

const rows = []; const pageIssues = [];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium' });
for (const [width, height, suffix] of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
  const page = await context.newPage();
  const consoleErrors = []; page.on('pageerror', e => consoleErrors.push(String(e).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(m.text().slice(0, 160)); });
  page.on('response', r => { if (r.status() >= 400) consoleErrors.push(`${r.status()} ${new URL(r.url()).pathname}`.slice(0, 160)); });
  await enterDemo(page);
  for (const slug of PAGES) {
    if (only && only !== slug) continue;
    await go(page, slug);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 2) pageIssues.push([`${slug}-${suffix}`, `Scroll horizontal de ${overflow} px en la página.`]);
    await page.screenshot({ path: `${out}/${slug}-${suffix}.png`, fullPage: true });
    const controls = await listControls(page);
    for (let i = 0; i < controls.length; i++) {
      const label = controls[i];
      await go(page, slug); await listControls(page);
      const target = page.locator(`[data-audit="${i}"]`).first();
      if (!(await target.count())) continue;
      const before = page.url();
      try { await target.click({ timeout: 2500 }); } catch { rows.push([slug, suffix, label, 'no se pudo tocar', '']); continue; }
      await page.waitForTimeout(500);
      const info = await inspectDialog(page, ENGLISH);
      if (info) {
        const file = `${slug}-${suffix}-${String(i).padStart(2, '0')}.png`;
        await page.screenshot({ path: `${out}/dialogos/${file}` }).catch(async () => { await mkdir(`${out}/dialogos`, { recursive: true }); await page.screenshot({ path: `${out}/dialogos/${file}` }); });
        await page.keyboard.press('Escape'); await page.waitForTimeout(300);
        const stillOpen = await page.evaluate(() => Boolean(document.querySelector('[role="dialog"], dialog[open], .fp-record-dialog, .photo-modal, [aria-modal="true"]')));
        const issues = [...info.issues]; if (stillOpen) issues.push('Escape no cierra el diálogo.');
        rows.push([slug, suffix, label, `diálogo «${info.name || 'sin nombre'}»`, issues.join(' ') || 'sin hallazgos', file]);
      } else if (page.url() !== before) rows.push([slug, suffix, label, `navega a ${new URL(page.url()).pathname}`, 'sin hallazgos']);
      else rows.push([slug, suffix, label, 'cambia la pantalla o no abre nada', 'revisar a mano']);
    }
  }
  if (consoleErrors.length) pageIssues.push([`consola-${suffix}`, [...new Set(consoleErrors)].slice(0, 6).join(' | ')]);
  await context.close();
}
await browser.close();

const withFindings = rows.filter(r => r[4] && r[4] !== 'sin hallazgos' && r[4] !== 'revisar a mano');
const table = ['| Página | Tamaño | Control | Qué abre | Hallazgos |', '|---|---|---|---|---|', ...rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[4] || ''} |`)].join('\n');
const problems = pageIssues.length ? ['', '## Problemas de página', ...pageIssues.map(p => `- **${p[0]}:** ${p[1]}`)].join('\n') : '';
await writeFile(`${out}/informe.md`, `# Auditoría de pantallas y diálogos de la paciente\n\nGenerado por \`scripts/nutrigo-audit.mjs\` el ${new Date().toISOString().slice(0, 10)}, en la demo local con datos de ejemplo (1440 y 390).\n\n**Controles probados:** ${rows.length}. **Con hallazgos:** ${withFindings.length}.${problems}\n\n## Controles\n\n${table}\n`);
console.log(`Controles: ${rows.length}, con hallazgos: ${withFindings.length}, problemas de página: ${pageIssues.length}`);
