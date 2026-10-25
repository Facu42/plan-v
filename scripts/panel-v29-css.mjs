// Pasa los estilos y los íconos del boceto v29 (design/panel-nutri/v29/panel-trabajo.html) a archivos NUEVOS,
// SIN cambiar ningún valor y SIN pisar panel-boceto.css (esa hoja sigue siendo la que ve la nutri).
// Genera:
//   src/components/nutrigo/panel-v29.css      → los <style> del boceto, limitados a #pv-panel-v29
//   src/components/nutrigo/panel-v29-icons.ts → los trazos de `IC` / `svg()` del boceto
// Uso: node scripts/panel-v29-css.mjs   (los archivos generados no se editan a mano)
//
// Cómo se limita: la raíz prevista para la fase del armazón es `#pv-panel-v29`.
//   `:root…`  → `#pv-panel-v29…`  (las variables del tema quedan en ese nodo)
//   `*`       → `#pv-panel-v29, #pv-panel-v29 *`
//   el resto  → `#pv-panel-v29 <selector>`
// Se dejan afuera el marco de la página del boceto (barra de pantallas, tema, escenario a escala)
// y las reglas de html/body de esa página. No se copia GSAP. Las fotos viven en el JS del HTML
// (MPH / RCI) y se extraen cuando una pantalla las necesite.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const postcss = require('postcss');

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fuente = resolve(raiz, 'design/panel-nutri/v29/panel-trabajo.html');
const html = await readFile(fuente, 'utf8');
const ID = '#pv-panel-v29';
const PAGINA = ['.bar', '.seg', '.stagewrap', '.stage'];
const MARCAS = ['.app', '.side', '.logo', '.fold', '.srch', '.nv', '.acct', '.main', '.top'];

for (const marca of MARCAS) {
  if (!html.includes(marca)) throw new Error(`El boceto v29 no tiene «${marca}»`);
}

const estilos = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
if (!estilos.length) throw new Error('No encontré <style> en el boceto v29');

const dePagina = sel => PAGINA.some(p => sel === p || sel.startsWith(`${p} `) || sel.startsWith(`${p}.`) || sel.startsWith(`${p}:`) || sel.startsWith(`${p}[`));
function limitar(sel) {
  const s = sel.trim();
  if (dePagina(s) || s === 'html' || s === 'body') return null;
  if (s === ':root' || s.startsWith(':root')) return s.replace(/^:root/, ID);
  if (s === '*') return `${ID}, ${ID} *`;
  return `${ID} ${s}`;
}

const arbol = postcss.parse(estilos.join('\n'));
arbol.walkRules(regla => {
  if (regla.parent?.type === 'atrule' && /keyframes$/.test(regla.parent.name)) return;
  const selectores = regla.selectors.map(limitar).filter(Boolean);
  if (selectores.length) regla.selectors = selectores; else regla.remove();
});
arbol.walkAtRules('media', regla => { if (!regla.nodes?.length) regla.remove(); });

const aviso = `/* GENERADO por scripts/panel-v29-css.mjs desde design/panel-nutri/v29/panel-trabajo.html. No editar a mano.
   No importar en la app hasta la fase del armazón: la nutri sigue viendo panel-boceto.css.
   La raíz prevista es ${ID}. */\n`;
await writeFile(resolve(raiz, 'src/components/nutrigo/panel-v29.css'), aviso + arbol.toString().trim() + '\n');

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
const iconos = Object.fromEntries(Object.entries(caja.IC).sort(([a], [b]) => a.localeCompare(b)));
const menu = ['grid', 'users', 'cal', 'coin', 'globe', 'clip', 'chat', 'team', 'gear', 'bell', 'plus', 'spark', 'fork', 'heart', 'trend', 'search', 'chev'];
for (const nombre of menu) {
  if (!(nombre in iconos)) throw new Error(`El boceto v29 no tiene el ícono «${nombre}»`);
}
await writeFile(resolve(raiz, 'src/components/nutrigo/panel-v29-icons.ts'), `// GENERADO por scripts/panel-v29-css.mjs: trazos de \`IC\` del boceto v29 (design/panel-nutri/v29/panel-trabajo.html). No editar a mano.\nexport const PANEL_V29_ICONS = ${JSON.stringify(iconos, null, 1)} as const;\nexport type PanelV29IconName = keyof typeof PANEL_V29_ICONS;\n`);

console.log(`panel-v29.css y ${Object.keys(iconos).length} íconos generados desde panel-trabajo.html.`);
