// Compara una pantalla de la app contra el CÓDIGO del boceto v29, clase por clase.
//
// Recorre cada combinación de etiqueta y clases que usa el boceto dentro de la pantalla, la mide en el boceto y en la app
// (tipografía, color, fondo, borde, espacios) y avisa de lo que falta o difiere. Lo que el boceto dibuja con datos de ejemplo
// y no aparece en la app queda pendiente de clasificación: nunca se aprueba como igual.
//
// Uso (app en demo: `npm run local`):
//   npm run panel:revision:v29 (todas las pantallas, ambos temas y archivos de evidencia)
//   node scripts/panel-v29-clases.mjs <pantalla> [--tema=dark|light] [--write]
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { usarAgendaDeEjemplo } from './panel-v29-agenda-ejemplo.mjs';
import { abrirApp, abrirBoceto, abrirFichaApp, simularHistoria, simularLaboratorio, simularConsultas, igual, playwright } from './panel-v29-contrato.mjs';
import { existsSync } from 'node:fs';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROPS = ['fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderTopLeftRadius', 'borderTopWidth', 'borderTopColor', 'paddingTop', 'paddingLeft', 'display', 'columnGap', 'lineHeight', 'textTransform', 'letterSpacing', 'position', 'overflow', 'rowGap', 'marginTop', 'marginLeft', 'alignItems', 'justifyContent', 'gridTemplateColumns'];

async function irA(a, ruta) {
  await a.goto(`${process.env.PLANV_ORIGIN ?? 'http://127.0.0.1:5173'}${ruta}`, { waitUntil: 'domcontentloaded' });
  const demo = a.getByText('Continuar en modo demo');
  if (await demo.count()) await demo.first().click();
  await a.waitForSelector('#pv-panel-v29', { timeout: 60000 });
}

function pantallaSimple(id, ruta) {
  return { raiz: `#s-${id}`, vistas: [0], preparar: async () => {},
    abrirBoceto: async b => { await b.evaluate(id => globalThis.go(id), id); await b.waitForSelector(`#s-${id}:not([hidden])`); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, ruta); await a.waitForSelector(`#s-${id}`); await a.waitForTimeout(800); },
  };
}
function pantallaConSolapas(id, ruta, solapas, selector) {
  const base = pantallaSimple(id, ruta);
  return { ...base, vistas: solapas,
    abrirBoceto: async (b, vista) => { await base.abrirBoceto(b); await b.locator(`${selector} button`).filter({ hasText: new RegExp(`^${vista}$`) }).click(); await b.waitForTimeout(600); },
    abrirApp: async (a, vista) => { if (!(await a.locator(`#s-${id}`).count())) await base.abrirApp(a); await a.getByRole(id === 'planes' ? 'button' : 'tab', { name: vista, exact: true }).click(); await a.waitForTimeout(800); },
  };
}

const PANTALLAS = {
  ficha: {
    raiz: '#s-ficha', vistas: ['resumen','historia','mediciones','objetivos','consultas','plan','alimentario','laboratorio','archivos','cobros'],
    preparar: async a => { await simularHistoria(a); await simularLaboratorio(a); await simularConsultas(a); },
    abrirBoceto: async (b, vista) => { await b.evaluate(() => globalThis.go('ficha')); await b.locator(`#ftabs [data-ft="${vista}"]`).click(); await b.waitForTimeout(700); },
    abrirApp: async (a, vista) => { if (!(await a.locator('#s-ficha').count())) await abrirFichaApp(a); const nombres = { resumen:'Resumen',historia:'Historia clínica',mediciones:'Mediciones',objetivos:'Objetivos y hábitos',consultas:'Consultas y notas',plan:'Plan',alimentario:'Registro alimentario',laboratorio:'Laboratorio y estudios',archivos:'Archivos',cobros:'Cobros' }; await a.locator('#ftabs button').filter({hasText: new RegExp(`^${nombres[vista]}`)}).click(); await a.waitForTimeout(800); },
  },
  inicio: pantallaSimple('inicio', '/crm/inicio'),
  pacientes: { ...pantallaSimple('pacientes', '/crm/pacientes'), abrirApp: async a => { await irA(a, '/crm/pacientes'); await a.locator('#prows tr[data-i]').first().click(); await a.waitForSelector('#prows .pdin'); await a.waitForTimeout(800); } },
  'planes-editor': { raiz: '#s-planes', vistas: [0], preparar: async () => {},
    abrirBoceto: async b => { await b.evaluate(() => globalThis.go('planes')); await b.locator('#pview button').first().click(); await b.locator('#s-planes .r29-table .sbtn', {hasText:'Abrir plan'}).first().click(); await b.waitForSelector('#s-planes .pedays'); },
    abrirApp: async a => { await irA(a, '/crm/plan'); await a.locator('#s-planes .r29-table .sbtn', {hasText:'Crear plan'}).first().click(); await a.getByRole('button', {name:'Empezar vacío',exact:true}).click(); await a.waitForSelector('#s-planes .pedays'); await a.waitForTimeout(800); },
  },
  recetas: { raiz: '#s-planes', raizApp: '#pv-panel', vistas: [0], preparar: async () => {},
    abrirBoceto: async b => { await b.evaluate(() => globalThis.go('planes')); await b.locator('#pview button').nth(2).click(); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, '/crm/biblioteca?biblioteca=recetas'); await a.waitForTimeout(800); },
  },
  agenda: { ...pantallaSimple('agenda', '/crm/agenda'), preparar: usarAgendaDeEjemplo },
  equipo: pantallaConSolapas('equipo', '/crm/equipo', ['Integrantes', 'Permisos', 'Registro de accesos'], '#eqview'),
  ajustes: pantallaConSolapas('ajustes', '/crm/ajustes', ['Mi cuenta', 'Plantillas', 'Avisos automáticos', 'Seguridad', 'Integraciones'], '#ajview'),
  planes: pantallaConSolapas('planes', '/crm/plan', ['Todos los planes', 'Plantillas', 'Equivalencias'], '#pview'),
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
    raiz: '#s-mensajes', vistas: [0, 1, 2],
    abrirBoceto: async (b, vista) => { await b.locator('[data-go="mensajes"]').first().click(); await b.locator('#mview button').nth(vista).click(); await b.waitForSelector('#s-mensajes:not([hidden])', { timeout: 10000 }); await b.waitForTimeout(600); },
    abrirApp: async (a, vista) => { await irA(a, '/crm/mensajes'); await a.getByRole('button', {name: ['Bandeja','Respuestas guardadas','Avisos automáticos'][vista], exact:true}).click(); await a.waitForSelector('#s-mensajes', { timeout: 20000 }); await a.waitForTimeout(800); },
    preparar: async () => {},
  },
  seguimiento: {
    raiz: '#s-seguimiento', vistas: [0],
    abrirBoceto: async b => { await b.locator('[data-go="seguimiento"]').first().click(); await b.waitForSelector('#s-seguimiento:not([hidden]) #sxw-seguimiento *', { timeout: 10000 }); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, '/crm/seguimiento'); await a.waitForSelector('#s-seguimiento', { timeout: 20000 }); await a.waitForTimeout(800); },
    preparar: async () => {},
  },
  progreso: {
    raiz: '#s-progreso', vistas: [0],
    abrirBoceto: async b => { await b.locator('[data-go="progreso"]').first().click(); await b.waitForSelector('#s-progreso:not([hidden]) #sxw-progreso *', { timeout: 10000 }); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, '/crm/progreso-global'); await a.waitForSelector('#s-progreso', { timeout: 20000 }); await a.waitForTimeout(800); },
    preparar: async () => {},
  },
  asistente: {
    raiz: '#s-asistente', vistas: [0],
    abrirBoceto: async b => { await b.locator('[data-go="asistente"]').first().click(); await b.waitForSelector('#s-asistente:not([hidden]) #sxw-asistente *', { timeout: 10000 }); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, '/crm/desarrollo?modulo=asistente-ia'); await a.waitForSelector('#s-asistente', { timeout: 20000 }); await a.waitForTimeout(800); },
    preparar: async () => {},
  },
  alimentos: {
    raiz: '#s-alimentos', vistas: [0],
    abrirBoceto: async b => { await b.locator('[data-go="alimentos"]').first().click(); await b.waitForSelector('#s-alimentos:not([hidden]) #sxw-alimentos *', { timeout: 10000 }); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, '/crm/alimentos'); await a.waitForSelector('#s-alimentos', { timeout: 20000 }); await a.waitForTimeout(800); },
    preparar: async () => {},
  },
  biblioteca: {
    raiz: '#s-biblioteca', vistas: [0],
    abrirBoceto: async b => { await b.locator('[data-go="biblioteca"]').first().click(); await b.waitForSelector('#s-biblioteca:not([hidden]) #sxw-biblioteca *', { timeout: 10000 }); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, '/crm/biblioteca'); await a.waitForSelector('#s-biblioteca', { timeout: 20000 }); await a.waitForTimeout(800); },
    preparar: async () => {},
  },
  ayuda: {
    raiz: '#s-ayuda', vistas: [0],
    abrirBoceto: async b => { await b.locator('[data-go="ayuda"]').first().click(); await b.waitForSelector('#s-ayuda:not([hidden]) #sxw-ayuda *', { timeout: 10000 }); await b.waitForTimeout(600); },
    abrirApp: async a => { await irA(a, '/crm/ayuda'); await a.waitForSelector('#s-ayuda', { timeout: 20000 }); await a.waitForTimeout(800); },
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
      if (!vistos.has(sel)) vistos.set(sel, el.textContent.replace(/\s+/g, ' ').trim().slice(0, 28));
    }
    return [...vistos.entries()];
  }, raizSel);
}

async function medirMuchas(pagina, lista, raiz, raizApp) {
  return pagina.evaluate(({ lista, props, raiz, raizApp }) => Object.fromEntries(lista.map(([sel]) => {
    const el = [...document.querySelectorAll(raizApp ? sel.replace(raiz, raizApp) : sel)].find(el => { const r = el.getBoundingClientRect(); return r.width > 0 || r.height > 0; });
    if (!el) return [sel, null];
    const css = getComputedStyle(el);
    return [sel, Object.fromEntries(props.map(k => [k, css[k]]))];
  })), { lista, props: PROPS, raiz, raizApp });
}

export async function correr(nombre, tema) {
  const def = PANTALLAS[nombre];
  console.error(`Revisando ${nombre} (${tema})…`);
  const { chromium } = playwright();
  const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--headless=new'], ignoreDefaultArgs: ['--headless=old'] });
  const filas = []; let iguales = 0; let distintas = 0; let faltan = 0; const vistas = [];
  try {
    const b = await abrirBoceto(navegador, tema);
    const a = await abrirApp(navegador, tema);
    await def.preparar(a);
    for (const vista of def.vistas) {
      try {
      await def.abrirBoceto(b, vista); await def.abrirApp(a, vista);
      const lista = await selectores(b, def.raiz);
      if (!lista.length) throw new Error(`El boceto no produjo piezas visibles en ${def.raiz}`);
      vistas.push(vista);
      filas.push(`\n### Vista ${typeof vista === 'number' ? vista + 1 : vista} de ${def.vistas.length} · ${lista.length} piezas del boceto\n`, '| Pieza del boceto | Estado | Detalle |', '|---|---|---|');
      const [fuente, app] = await Promise.all([medirMuchas(b, lista), medirMuchas(a, lista, def.raiz, def.raizApp)]);
      for (const [sel, texto] of lista) {
        const [f, p] = [fuente[sel], app[sel]];
        const corto = sel.replace(def.raiz + ' ', '');
        if (!f) continue;
        if (!p) { faltan += 1; filas.push(`| \`${corto}\` (${texto || '—'}) | ⚠️ no encontrada | requiere revisar si falta estructura, estado o datos; no se certifica como igual |`); continue; }
        const mal = PROPS.filter(k => !(k === 'borderTopColor' && f.borderTopWidth === '0px' && p.borderTopWidth === '0px') && !igual(f[k], p[k]));
        if (!mal.length) { iguales += 1; continue; }
        distintas += 1;
        filas.push(`| \`${corto}\` | ❌ distinta | ${mal.map(k => `**${k}**: boceto \`${f[k]}\` · app \`${p[k]}\``).join('<br>')} |`);
      }
      } catch (e) { distintas += 1; vistas.push({ vista, error: e.message }); filas.push(`\n### Vista ${vista}: BLOQUEADA\n\n${e.message}\n`); }
    }
  } finally { await navegador.close(); }
  return { texto: `# Muestreo de estilos: ${nombre} contra el código del boceto v29 (tema ${tema})\n\nComparación por etiqueta y clases (primera coincidencia visible); no certifica el árbol completo ni estados sin recorrer.\n\n${iguales} muestras iguales · ${distintas} distintas · ${faltan} no encontradas\n${filas.join('\n')}\n`, distintas, faltan, iguales, vistas };
}

const args = process.argv.slice(2);
const nombres = args.includes('--todas') ? Object.keys(PANTALLAS) : args.filter(x => PANTALLAS[x]);
if (!nombres.length) { console.error(`Uso: node scripts/panel-v29-clases.mjs ${Object.keys(PANTALLAS).join('|')}|--todas [--ambos] [--tema=dark|light] [--write]`); process.exit(2); }
const temas = args.includes('--ambos') ? ['dark', 'light'] : [(args.find(x => x.startsWith('--tema=')) ?? '--tema=dark').split('=')[1]];
let errores = 0;
const resumen = [];
for (const nombre of nombres) for (const tema of temas) {
  try {
    const r = await correr(nombre, tema);
    console.log(r.texto);
    resumen.push({ nombre, tema, iguales: r.iguales, distintas: r.distintas, noEncontradas: r.faltan, vistas: r.vistas });
    if (r.distintas || r.faltan) errores++;
    if (args.includes('--write')) await writeFile(resolve(raiz, `design/panel-nutri/v29/clases-${nombre}-${tema}.md`), r.texto);
  } catch (e) {
    errores++;
    const error = e.message;
    resumen.push({ nombre, tema, error });
    console.error(`${nombre} (${tema}): BLOQUEADO: ${error}`);
  }
}
if (args.includes('--write')) await writeFile(resolve(raiz, 'design/panel-nutri/v29/revision-completa.json'), JSON.stringify(resumen, null, 2) + '\n');
console.log(JSON.stringify(resumen, null, 2));
process.exit(errores ? 1 : 0);
