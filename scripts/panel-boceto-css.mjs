// Pasa los estilos, los íconos y las imágenes del boceto aprobado (design/panel-nutri/bocetos.html) a la app,
// SIN cambiar ningún valor. Genera:
//   src/components/nutrigo/panel-boceto.css      → el <style> del boceto, limitado al panel
//   src/components/nutrigo/panel-boceto-icons.ts → los trazos de `ic()` (objeto P del boceto)
//   public/panel-boceto/                          → logo y fotos de comida difuminadas
// Uso: node scripts/panel-boceto-css.mjs   (los archivos generados no se editan a mano)
//
// Cómo se limita sin cambiar el orden en que ganan las reglas: la raíz del panel es `.m.desk#pv-panel`.
// A cada selector se le suma el mismo peso (el id), así ninguna regla de la app le gana al boceto y entre
// reglas del boceto sigue ganando la misma que en el archivo:
//   `.m X`                      → `.m#pv-panel X`
//   `html[data-mock=dark] .m X` → `html[data-mock=dark] .m#pv-panel X`
//   `.desk…`                    → `#pv-panel.desk…`
//   `X` (sin `.m`)              → `#pv-panel X`
// Se dejan afuera las reglas de la página que muestra los bocetos (encabezado, botones de pantallas, marco
// del celular) y las variables de `:root`/`body` de esa página.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const postcss = require('postcss');

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(resolve(raiz, 'design/panel-nutri/bocetos.html'), 'utf8');
// Las pantallas ya pasadas a v29 se estilan solo con panel-v29.css: sin esto, las variables y reglas de este archivo
// (el boceto viejo) les ganan y cambian colores, sombras, botones y gráficos. Equipo, Ajustes, Ayuda y las demás siguen con este.
const PASADAS_A_V29 = ['inicio', 'pacientes', 'agenda', 'ficha', 'seguimiento', 'progreso', 'asistente', 'alimentos', 'biblioteca', 'planes', 'mensajes', 'cobranzas', 'publica', 'equipo', 'ajustes'];
const SOLO_VIEJAS = `:where(:not(:has(${PASADAS_A_V29.map(p => `#s-${p}`).join(",")})))`; // :where no suma peso: las reglas viejas siguen ganando igual que antes en sus pantallas
const ID = `#pv-panel${SOLO_VIEJAS}`;
const INICIO_PANEL = '/* ============ Boceto';
const PAGINA = ['.scr', '#canvas', '.ph', '.page', '.head', '.frame', '.canvas', '.duo', '.txt', '.foot', '.ctl', '.sn'];

const estilo = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
const desde = estilo.indexOf(INICIO_PANEL);
if (desde < 0) throw new Error(`No encontré «${INICIO_PANEL}» en el boceto`);

const fotos = [];
function sacarImagen(_, comilla, tipo, datos) {
  const nombre = `pb${fotos.length + 1}.${tipo === 'jpeg' ? 'jpg' : tipo}`;
  fotos.push([nombre, datos]);
  return `url('/panel-boceto/${nombre}')`;
}
const css = estilo.slice(desde).replace(/url\((["']?)data:image\/(\w+);base64,([^)"']+)\1\)/g, sacarImagen);

const dePagina = sel => PAGINA.some(p => sel === p || sel.startsWith(`${p} `) || sel.startsWith(`${p}.`) || sel.startsWith(`${p}:`) || sel.startsWith(`${p}[`));
function limitar(sel) {
  const s = sel.trim();
  if (dePagina(s)) return null;
  const oscuro = /^(html\[data-mock="dark"\]\s+)\.m(?=[\s.:[#>]|$)/;
  if (oscuro.test(s)) return s.replace(oscuro, `$1.m${ID}`);
  if (/^\.m(?=[\s.:[#>]|$)/.test(s)) return s.replace(/^\.m/, `.m${ID}`);
  if (/^\.desk(?=[\s.:[>]|$)/.test(s)) return `${ID}${s}`;
  return `${ID} ${s}`;
}

const arbol = postcss.parse(css);
arbol.walkRules(regla => {
  if (regla.parent?.type === 'atrule' && /keyframes$/.test(regla.parent.name)) return;
  const selectores = regla.selectors.map(limitar).filter(Boolean);
  if (selectores.length) regla.selectors = selectores; else regla.remove();
});
arbol.walkAtRules('media', regla => { if (!regla.nodes?.length) regla.remove(); });

const aviso = '/* GENERADO por scripts/panel-boceto-css.mjs desde design/panel-nutri/bocetos.html. No editar a mano:\n   lo que la app necesita y el boceto no tiene va en panel-boceto-app.css. */\n';
await writeFile(resolve(raiz, 'src/components/nutrigo/panel-boceto.css'), aviso + arbol.toString().trim() + '\n');

// Íconos: se evalúan los mismos objetos del boceto (P y sus Object.assign) y se guardan sus trazos.
const script = html.slice(html.indexOf('<script>') + 8, html.indexOf('</script>', html.indexOf('<script>')));
const bloques = script.match(/const P=\{[\s\S]*?\n\};|Object\.assign\(P,\{[\s\S]*?\n\}\);/g) ?? [];
const caja = {};
vm.runInNewContext(`${bloques.join('\n').replace('const P=', 'P=')}`, Object.assign(caja, { P: undefined }));
const iconos = Object.fromEntries(Object.entries(caja.P).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(resolve(raiz, 'src/components/nutrigo/panel-boceto-icons.ts'), `// GENERADO por scripts/panel-boceto-css.mjs: trazos de \`ic()\` del boceto (design/panel-nutri/bocetos.html). No editar a mano.\nexport const PANEL_BOCETO_ICONS = ${JSON.stringify(iconos, null, 1)} as const;\nexport type PanelBocetoIconName = keyof typeof PANEL_BOCETO_ICONS;\n`);

// Imágenes: logo de la barra lateral y fotos difuminadas de las tarjetas.
const carpeta = resolve(raiz, 'public/panel-boceto');
await mkdir(carpeta, { recursive: true });
const logo = html.match(/const LOGO="data:image\/png;base64,([^"]+)"/);
if (!logo) throw new Error('No encontré el logo del boceto');
await writeFile(resolve(carpeta, 'logo.png'), Buffer.from(logo[1], 'base64'));
for (const [nombre, datos] of fotos) await writeFile(resolve(carpeta, nombre), Buffer.from(datos, 'base64'));
console.log(`panel-boceto.css, ${Object.keys(iconos).length} íconos, logo y ${fotos.length} fotos generados.`);
