// Pasa los estilos y los íconos del boceto v29 (design/panel-nutri/v29/panel-trabajo.html) a archivos NUEVOS,
// SIN cambiar ningún valor y SIN pisar panel-boceto.css (esa hoja sigue siendo la que ve la nutri).
// Genera:
//   src/components/nutrigo/panel-v29.css      → los <style> del boceto, limitados a #pv-panel-v29
//   src/components/nutrigo/panel-v29-icons.ts → los trazos de `IC` / `svg()` del boceto
// Uso: node scripts/panel-v29-css.mjs   (los archivos generados no se editan a mano)
//
// Cómo se limita: la raíz prevista para la fase del armazón es `#pv-panel-v29`.
// En el boceto el tema (`data-theme`) y el celular (`.mob`, `.mreal`) viven en `<html>`.
// Acá esa raíz ocupa el lugar de `:root` y de `<html>`, para que el shell no tenga que
// inventar un envoltorio:
//   `:root…`              → `#pv-panel-v29…`
//   `.mob .app`           → `#pv-panel-v29.mob .app`
//   `.mob.mreal body`     → `#pv-panel-v29.mob.mreal`  (el relleno del celular real)
//   `*` / `*::scrollbar`  → la raíz y lo de adentro
//   el resto              → `#pv-panel-v29 <selector>`
// De `<body>` se copian la letra, el color y el suavizado. No se copia el relleno ni el
// fondo de la página del boceto (barra de pantallas, escenario a escala). No se copia GSAP.
// Las fotos viven en el JS del HTML (MPH / RCI) y se extraen cuando una pantalla las necesite.
// `--check` compara con los archivos ya generados y no escribe.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const postcss = require('postcss');

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const soloChequeo = process.argv.includes('--check');
const fuente = resolve(raiz, 'design/panel-nutri/v29/panel-trabajo.html');
const html = (await readFile(fuente, 'utf8')).replace(/\r\n/g, '\n');
const ID = '#pv-panel-v29';
const PAGINA = ['.bar', '.seg', '.stagewrap', '.stage'];
const MARCAS = ['.app', '.side', '.logo', '.fold', '.srch', '.nv', '.acct', '.main', '.top'];

for (const marca of MARCAS) {
  if (!html.includes(marca)) throw new Error(`El boceto v29 no tiene «${marca}»`);
}

const estilos = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
if (!estilos.length) throw new Error('No encontré <style> en el boceto v29');

const dePagina = sel => PAGINA.some(p => sel === p || sel.startsWith(`${p} `) || sel.startsWith(`${p}.`) || sel.startsWith(`${p}:`) || sel.startsWith(`${p}[`));
const CLASE_DOC = '(?:\\.mob|\\.mreal)+';

function limitar(sel) {
  let s = sel.trim();
  if (dePagina(s)) return null;
  if (s === 'html' || s === 'body') return null;
  if (s === ':root' || s.startsWith(':root')) return s.replace(/^:root\b/, ID);
  if (s === '*' || s.startsWith('*')) {
    const resto = s.slice(1);
    return [`${ID}${resto}`, `${ID} *${resto}`];
  }
  if (s.startsWith(':')) return [`${ID}${s}`, `${ID} ${s}`];

  const cuerpo = s.match(new RegExp(`^(${CLASE_DOC})\\s+body$`));
  if (cuerpo) return `${ID}${cuerpo[1]}`;
  s = s.replace(/^body(?=[\s>+~])/, ID).replace(/^html(?=[\s>+~.#:[])/, ID);

  const doc = s.match(new RegExp(`^(${CLASE_DOC})(?=[\\s>+~#.:\\[])`));
  if (doc) return `${ID}${doc[1]}${s.slice(doc[1].length)}`;
  if (s.startsWith(ID)) return s;
  return `${ID} ${s}`;
}

const arbol = postcss.parse(estilos.join('\n'));
arbol.walkRules(regla => {
  if (regla.parent?.type === 'atrule' && /keyframes$/.test(regla.parent.name)) return;
  const originales = regla.selectors.map(s => s.trim());
  if (originales.every(s => s === 'html' || s === 'body')) {
    regla.walkDecls(d => {
      const prop = d.prop.toLowerCase();
      if (prop === 'background' || prop === 'background-color' || prop === 'margin' || prop.startsWith('padding')) d.remove();
    });
    if (!regla.nodes?.some(n => n.type === 'decl')) { regla.remove(); return; }
    regla.selectors = [ID];
    return;
  }
  const selectores = regla.selectors.flatMap(sel => {
    const salida = limitar(sel);
    return salida == null ? [] : (Array.isArray(salida) ? salida : [salida]);
  });
  if (selectores.length) regla.selectors = selectores; else regla.remove();
});
arbol.walkAtRules('media', regla => { if (!regla.nodes?.length) regla.remove(); });

const aviso = `/* GENERADO por scripts/panel-v29-css.mjs desde design/panel-nutri/v29/panel-trabajo.html. No editar a mano.
   La raíz del armazón de la nutri importa esta hoja. Las pantallas que todavía no se pasaron siguen con panel-boceto.css.
   La raíz es ${ID}: ocupa el lugar de :root y de <html> (tema, .mob y .mreal).
   La letra y el color de <body> quedan ahí, sin el relleno de la página del boceto. */\n`;
const cssSalida = aviso + arbol.toString().trim() + '\n';
const rutaCss = resolve(raiz, 'src/components/nutrigo/panel-v29.css');

const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes('const IC='));
if (!script) throw new Error('No encontré const IC= en el boceto v29');

function extraerBloquesIC(texto) {
  const bloques = [];
  const siguiente = desde => {
    const a = texto.indexOf('const IC=', desde);
    const b = texto.indexOf('Object.assign(IC,', desde);
    if (a < 0 && b < 0) return -1;
    if (a >= 0 && (b < 0 || a < b)) return a;
    return b;
  };
  let i = 0;
  while (true) {
    const p = siguiente(i);
    if (p < 0) break;
    const llave = texto.indexOf('{', p);
    let profundidad = 0;
    let comilla = '';
    let j = llave;
    for (; j < texto.length; j++) {
      const c = texto[j];
      if (comilla) {
        if (c === '\\') { j += 1; continue; }
        if (c === comilla) comilla = '';
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { comilla = c; continue; }
      if (c === '{') profundidad += 1;
      else if (c === '}') {
        profundidad -= 1;
        if (profundidad === 0) {
          j += 1;
          while (j < texto.length && /[\s)]/.test(texto[j])) j += 1;
          if (texto[j] === ';') j += 1;
          bloques.push(texto.slice(p, j).replace(/^const IC=/, 'IC='));
          i = j;
          break;
        }
      }
    }
  }
  return bloques;
}

const bloques = extraerBloquesIC(script);
if (!bloques.length) throw new Error('No pude leer los objetos IC del boceto v29');
const caja = { IC: {} };
vm.runInNewContext(bloques.join('\n'), caja);
for (const extra of script.matchAll(/IC\.([A-Za-z0-9_]+)\s*\|\|=\s*'([^']*)'/g)) caja.IC[extra[1]] ??= extra[2];
const iconos = Object.fromEntries(Object.entries(caja.IC).sort(([a], [b]) => a.localeCompare(b)));
const menu = ['grid', 'users', 'cal', 'coin', 'globe', 'clip', 'chat', 'team', 'gear', 'bell', 'plus', 'spark', 'fork', 'heart', 'trend', 'search', 'chev', 'menu', 'dots'];
for (const nombre of menu) {
  if (!(nombre in iconos)) throw new Error(`El boceto v29 no tiene el ícono «${nombre}»`);
}
const iconosTs = `// GENERADO por scripts/panel-v29-css.mjs: trazos de \`IC\` del boceto v29 (design/panel-nutri/v29/panel-trabajo.html). No editar a mano.\nexport const PANEL_V29_ICONS = ${JSON.stringify(iconos, null, 1)} as const;\nexport type PanelV29IconName = keyof typeof PANEL_V29_ICONS;\n`;
const rutaIconos = resolve(raiz, 'src/components/nutrigo/panel-v29-icons.ts');

async function dejar(ruta, texto, nombre) {
  if (!soloChequeo) { await writeFile(ruta, texto); return; }
  const actual = await readFile(ruta, 'utf8').catch(() => '');
  if (actual.replace(/\r\n/g, '\n') !== texto.replace(/\r\n/g, '\n')) {
    console.error(`${nombre} no coincide con panel-trabajo.html. Corré: node scripts/panel-v29-css.mjs`);
    process.exitCode = 1;
  }
}

await dejar(rutaCss, cssSalida, 'panel-v29.css');
await dejar(rutaIconos, iconosTs, 'panel-v29-icons.ts');
if (process.exitCode) process.exit(process.exitCode);
console.log(soloChequeo
  ? `panel-v29.css y ${Object.keys(iconos).length} íconos coinciden con panel-trabajo.html.`
  : `panel-v29.css y ${Object.keys(iconos).length} íconos generados desde panel-trabajo.html.`);
