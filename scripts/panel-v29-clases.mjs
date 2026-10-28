// Compara una pantalla de la app contra el CÓDIGO del boceto v29, clase por clase.
//
// Recorre cada combinación de etiqueta y clases que usa el boceto dentro de la pantalla, la mide en el boceto y en la app
// (tipografía, color, fondo, borde, espacios) y avisa de lo que falta o difiere. Lo que el boceto dibuja con datos de ejemplo
// y la app todavía no tiene dato queda como «sin dato», no como falla.
//
// Uso (app en demo: `npm run local`):
//   node scripts/panel-v29-clases.mjs publica|cobranzas|mensajes [--tema=dark|light] [--write]
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { usarAgendaDeEjemplo } from './panel-v29-agenda-ejemplo.mjs';
import { abrirApp, abrirBoceto, igual, playwright } from './panel-v29-contrato.mjs';
import { existsSync } from 'node:fs';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROPS = ['fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderTopLeftRadius', 'borderTopWidth', 'borderTopColor', 'paddingTop', 'paddingLeft', 'display', 'columnGap', 'lineHeight', 'textTransform', 'letterSpacing'];

async function irA(a, ruta) {
  await a.goto(`${process.env.PLANV_ORIGIN ?? 'http://127.0.0.1:5173'}${ruta}`, { waitUntil: 'domcontentloaded' });
  const demo = a.getByText('Continuar en modo demo');
  if (await demo.count()) await demo.first().click();
  await a.waitForSelector('#pv-panel-v29', { timeout: 60000 });
}

const PANTALLAS = {
  publica: {
    raiz: '#s-publica', vistas: [0, 1, 2],
    abrirBoceto: async (b, vista) => { await b.locator('[data-go="publica"]').first().click(); await b.waitForSelector('#s-publica:not([hidden]) #pubwrap .fxp', { timeout: 10000 }); await b.locator('#pubview button').nth(vista).click(); await b.waitForTimeout(500); },
    abrirApp: async (a, vista) => { if (!(await a.locator('#s-publica').count())) await a.locator('#pv-panel-v29 a.nv', { hasText: 'Página pública' }).first().click(); await a.waitForSelector('#s-publica #pubwrap .fxp', { timeout: 20000 }); await a.locator('#pubview button').nth(vista).click(); await a.waitForTimeout(600); },
    preparar: async a => { await usarAgendaDeEjemplo(a); },
  },
  cobranzas: {
    raiz: '#s-cobranzas', vistas: [0],
    abrirBoceto: async b => { await b.locator('[data-go="cobranzas"]').first().click(); await b.waitForSelector('#s-cobranzas:not([hidden]) .fxp', { timeout: 10000 }); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, '/crm/cobranzas'); await a.waitForSelector('#s-cobranzas .fxp', { timeout: 20000 }); await a.waitForTimeout(800); },
    preparar: async () => {},
  },
  mensajes: {
    raiz: '#s-mensajes', vistas: [0],
    abrirBoceto: async b => { await b.locator('[data-go="mensajes"]').first().click(); await b.waitForSelector('#s-mensajes:not([hidden])', { timeout: 10000 }); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, '/crm/mensajes'); await a.waitForSelector('#s-mensajes', { timeout: 20000 }); await a.waitForTimeout(800); },
    preparar: async () => {},
  },
};

/** Una selección por combinación (padre, etiqueta, clases, estado) que se ve dentro de la raíz del boceto. El encabezado de la pantalla se mide desde `.app .top`. */
async function selectores(pagina, raizSel) {
  return pagina.evaluate(raizSel => {
    const raiz = document.querySelector(raizSel);
    const vistos = new Map();
    const parte = el => {
      const clases = [...el.classList].filter(c => /^[a-zA-Z][\w-]*$/.test(c)).sort();
      const estado = ['aria-checked', 'aria-pressed'].map(a => el.hasAttribute(a) ? `[${a}="${el.getAttribute(a)}"]` : '').join('');
      return `${el.tagName.toLowerCase()}${clases.length ? '.' + clases.join('.') : ''}${estado}`;
    };
    for (const el of raiz.querySelectorAll('*')) {
      if (!el.classList.length || ['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const padre = el.parentElement && el.parentElement !== raiz && el.parentElement.classList.length ? parte(el.parentElement) + ' > ' : '';
      const enTop = el.closest('.top') && raiz.contains(el.closest('.top'));
      const sel = `${enTop ? '.app ' : raizSel + ' '}${padre}${parte(el)}`;
      if (!vistos.has(sel)) vistos.set(sel, el.textContent.trim().slice(0, 28));
    }
    return [...vistos.entries()];
  }, raizSel);
}

async function medir(pagina, sel) {
  const cajas = pagina.locator(sel);
  const n = await cajas.count();
  for (let i = 0; i < n; i += 1) {
    const caja = await cajas.nth(i).boundingBox();
    if (caja && (caja.width > 0 || caja.height > 0)) return cajas.nth(i).evaluate((el, props) => { const css = getComputedStyle(el); return Object.fromEntries(props.map(k => [k, css[k]])); }, PROPS);
  }
  return null;
}

async function correr(nombre, tema) {
  const def = PANTALLAS[nombre];
  const { chromium } = playwright();
  const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--headless=new'], ignoreDefaultArgs: ['--headless=old'] });
  const filas = []; let iguales = 0; let distintas = 0; let faltan = 0;
  try {
    const b = await abrirBoceto(navegador, tema);
    const a = await abrirApp(navegador, tema);
    await def.preparar(a);
    for (const vista of def.vistas) {
      await def.abrirBoceto(b, vista); await def.abrirApp(a, vista);
      const lista = await selectores(b, def.raiz);
      filas.push(`\n### Vista ${vista + 1} de ${def.vistas.length} · ${lista.length} piezas del boceto\n`, '| Pieza del boceto | Estado | Detalle |', '|---|---|---|');
      for (const [sel, texto] of lista) {
        const [f, p] = [await medir(b, sel), await medir(a, sel)];
        const corto = sel.replace(def.raiz + ' ', '');
        if (!f) continue;
        if (!p) { faltan += 1; filas.push(`| \`${corto}\` (${texto || '—'}) | ⚪ sin dato | la app no la dibuja con los datos de esta cuenta |`); continue; }
        const mal = PROPS.filter(k => !(k === 'borderTopColor' && f.borderTopWidth === '0px' && p.borderTopWidth === '0px') && !igual(f[k], p[k]));
        if (!mal.length) { iguales += 1; continue; }
        distintas += 1;
        filas.push(`| \`${corto}\` | ❌ distinta | ${mal.map(k => `**${k}**: boceto \`${f[k]}\` · app \`${p[k]}\``).join('<br>')} |`);
      }
    }
  } finally { await navegador.close(); }
  return { texto: `# ${nombre} contra el código del boceto v29 (tema ${tema})\n\n${iguales} piezas iguales · ${distintas} distintas · ${faltan} sin dato\n${filas.join('\n')}\n`, distintas };
}

const args = process.argv.slice(2);
const nombre = args.find(x => PANTALLAS[x]);
if (!nombre) { console.error('Uso: node scripts/panel-v29-clases.mjs publica|cobranzas|mensajes [--tema=dark|light] [--write]'); process.exit(2); }
const tema = (args.find(x => x.startsWith('--tema=')) ?? '--tema=dark').split('=')[1];
const { texto, distintas } = await correr(nombre, tema);
console.log(texto);
if (args.includes('--write')) await writeFile(resolve(raiz, `design/panel-nutri/v29/clases-${nombre}.md`), texto);
process.exit(distintas ? 1 : 0);
