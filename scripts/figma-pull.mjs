/* Baja el archivo de Nutrigo desde Figma y lo deja en formato trabajable.
 *
 * El .fig binario no sirve para trabajar: no hay parser abierto. Lo que sí es
 * "el .fig en código" es el árbol de nodos que devuelve la REST API, con la
 * geometría, los colores y la tipografía exactos de cada capa.
 *
 * Necesita un personal access token de Figma con scope file_content:read, que
 * anda en plan gratuito. Se lee de FIGMA_TOKEN: nunca se escribe en disco ni se
 * pasa por argumento, así no queda en el historial del shell.
 *
 *   FIGMA_TOKEN=... npm run figma:pull
 *
 * Deja:
 *   design/nutrigo-nodes/<slug>.json   árbol completo de cada frame
 *   design/nutrigo-exports/<slug>.png  render limpio a 2x
 *   design/nutrigo-svg/<slug>.svg      vector con geometría y texto exactos
 *   design/nutrigo-tokens.json         colores, tipografía, radios y espaciados
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { argv, env, exit } from 'node:process';

const FILE_KEY = env.FIGMA_FILE_KEY || 'OTolnKfsxUFjaZOhhdb04i';
const TOKEN = env.FIGMA_TOKEN;
const API = 'https://api.figma.com/v1';
const OUT = {
  nodes: 'design/nutrigo-nodes',
  png: 'design/nutrigo-exports',
  svg: 'design/nutrigo-svg',
  tokens: 'design/nutrigo-tokens.json',
};

const only = argv.slice(2).filter((a) => !a.startsWith('-'));
const wantSvg = !argv.includes('--no-svg');

async function figma(path) {
  const response = await fetch(`${API}${path}`, { headers: { 'X-Figma-Token': TOKEN } });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText} en ${path.split('?')[0]} ${body.slice(0, 200)}`);
  }
  return response.json();
}

export const slug = (name) => name
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\(desktop\)/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Frames de escritorio de nivel superior, en el orden del archivo. */
export function desktopFrames(document) {
  const frames = [];
  for (const page of document.children ?? []) {
    for (const node of page.children ?? []) {
      if (node.type !== 'FRAME') continue;
      if (!/\(desktop\)/i.test(node.name)) continue;
      frames.push({ id: node.id, name: node.name, slug: slug(node.name), page: page.name });
    }
  }
  return frames;
}

export const hex = (c) => '#' + ['r', 'g', 'b']
  .map((k) => Math.round((c[k] ?? 0) * 255).toString(16).padStart(2, '0'))
  .join('').toUpperCase();

/** Recorre el árbol acumulando lo que define la piel. */
export function harvest(node, acc) {
  for (const fill of node.fills ?? []) {
    if (fill.type === 'SOLID' && fill.visible !== false) {
      const key = hex(fill.color);
      acc.colors.set(key, (acc.colors.get(key) ?? 0) + 1);
    }
  }
  for (const stroke of node.strokes ?? []) {
    if (stroke.type === 'SOLID' && stroke.visible !== false) {
      const key = hex(stroke.color);
      acc.strokes.set(key, (acc.strokes.get(key) ?? 0) + 1);
    }
  }
  if (node.style?.fontFamily) {
    const s = node.style;
    const key = `${s.fontFamily} ${s.fontWeight} ${Math.round(s.fontSize)}/${Math.round(s.lineHeightPx ?? 0)}`;
    acc.type.set(key, (acc.type.get(key) ?? 0) + 1);
  }
  if (typeof node.cornerRadius === 'number') {
    acc.radii.set(node.cornerRadius, (acc.radii.get(node.cornerRadius) ?? 0) + 1);
  }
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    const key = `gap ${node.itemSpacing ?? 0} · pad ${node.paddingTop ?? 0}/${node.paddingRight ?? 0}/${node.paddingBottom ?? 0}/${node.paddingLeft ?? 0}`;
    acc.layout.set(key, (acc.layout.get(key) ?? 0) + 1);
  }
  for (const child of node.children ?? []) harvest(child, acc);
}

export const ranked = (map) => [...map.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([value, count]) => ({ value, count }));

async function download(url, path) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} bajando ${path}`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}

/** La API rechaza pedidos de imagen muy largos; de a tandas. */
async function renderBatch(ids, format, scale, dir, frames) {
  const query = new URLSearchParams({ ids: ids.join(','), format });
  if (format !== 'svg') query.set('scale', String(scale));
  const { images, err } = await figma(`/images/${FILE_KEY}?${query}`);
  if (err) throw new Error(`Figma no pudo renderizar: ${err}`);
  for (const id of ids) {
    const url = images?.[id];
    const frame = frames.find((f) => f.id === id);
    if (!url) { console.warn(`  sin render: ${frame?.name ?? id}`); continue; }
    const path = `${dir}/${frame.slug}.${format}`;
    await download(url, path);
    console.log(`  ${path}`);
  }
}

export const chunk = (list, size) => list.reduce((out, item, i) => {
  if (i % size === 0) out.push([]);
  out[out.length - 1].push(item);
  return out;
}, []);

async function main() {
  if (!TOKEN) {
    console.error('Falta FIGMA_TOKEN (scope file_content:read).');
    console.error('Generalo en Figma > Settings > Security > Personal access tokens.');
    console.error('Pasalo como variable de entorno, no como argumento.');
    exit(1);
  }
  console.log(`Archivo ${FILE_KEY}`);
  const index = await figma(`/files/${FILE_KEY}?depth=2`);
  console.log(`"${index.name}", última edición ${index.lastModified}`);

  let frames = desktopFrames(index.document);
  if (only.length) frames = frames.filter((f) => only.some((q) => f.slug.includes(slug(q))));
  if (!frames.length) {
    console.error('No encontré frames de escritorio. Revisá los nombres en el archivo.');
    exit(1);
  }
  console.log(`\n${frames.length} frames de escritorio:`);
  for (const f of frames) console.log(`  ${f.name}  (${f.id})`);

  await Promise.all(Object.values(OUT).slice(0, 3).map((dir) => mkdir(dir, { recursive: true })));

  console.log('\nÁrbol de nodos');
  const acc = { colors: new Map(), strokes: new Map(), type: new Map(), radii: new Map(), layout: new Map() };
  for (const frame of frames) {
    const { nodes } = await figma(`/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(frame.id)}`);
    const document = nodes?.[frame.id]?.document;
    if (!document) { console.warn(`  sin nodo: ${frame.name}`); continue; }
    const path = `${OUT.nodes}/${frame.slug}.json`;
    await writeFile(path, JSON.stringify(document, null, 2));
    harvest(document, acc);
    console.log(`  ${path}`);
  }

  console.log('\nPNG a 2x');
  for (const ids of chunk(frames.map((f) => f.id), 5)) {
    await renderBatch(ids, 'png', 2, OUT.png, frames);
  }

  if (wantSvg) {
    console.log('\nSVG');
    for (const ids of chunk(frames.map((f) => f.id), 5)) {
      await renderBatch(ids, 'svg', 1, OUT.svg, frames);
    }
  }

  const tokens = {
    source: { fileKey: FILE_KEY, name: index.name, lastModified: index.lastModified, pulledAt: new Date().toISOString() },
    frames: frames.map(({ id, name, slug, page }) => ({ id, name, slug, page })),
    fills: ranked(acc.colors),
    strokes: ranked(acc.strokes),
    type: ranked(acc.type),
    cornerRadius: ranked(acc.radii),
    autoLayout: ranked(acc.layout).slice(0, 40),
  };
  await writeFile(OUT.tokens, JSON.stringify(tokens, null, 2));
  console.log(`\n${OUT.tokens}`);
  console.log(`  ${tokens.fills.length} colores de relleno, ${tokens.type.length} estilos de texto, ${tokens.cornerRadius.length} radios`);
  console.log('\nListo. Los valores salen del archivo, no de una captura.');
}

const executedDirectly = import.meta.url === `file://${argv[1]}`;

if (executedDirectly) main().catch((error) => {
  console.error(`\n${error.message}`);
  if (/^403/.test(error.message)) {
    console.error('403 suele ser token sin scope file_content:read, o sin acceso a este archivo.');
  }
  exit(1);
});
