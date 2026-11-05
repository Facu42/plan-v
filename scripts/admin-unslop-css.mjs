import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/components/nutrigo/admin-crm/nd-styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const weight = new Set(), upper = new Set(), tiny = new Set();
for (const m of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
  const sel = m[1].trim(); const body = m[2];
  if (!sel || /^(from|to|\d+%)/.test(sel) || sel.includes('@')) continue;
  const list = sel.split(',').map((s) => s.trim()).filter(Boolean).filter((s) => !/::?(before|after)$/.test(s) || true);
  const up = /text-transform:\s*uppercase/.test(body);
  const w = /font-weight:\s*(600|650|700)/.test(body);
  const fs_ = body.match(/font-size:\s*([\d.]+)px/);
  const small = fs_ && Number(fs_[1]) < 11;
  for (const s of list) {
    if (!s.startsWith('.')) continue;
    if (up) upper.add(s); else if (small) tiny.add(s);
    if (w) weight.add(s);
  }
}
const j = (set) => [...set].map((s) => '.nd-admin-crm ' + s).join(',\n');
fs.writeFileSync(new URL('../src/components/nutrigo/admin-crm/nd-unslop-etiquetas.css', import.meta.url), `/* GENERADO con node scripts/admin-unslop-css.mjs (ver nd-unslop.css): etiquetas, tamaños y pesos a partir de nd-styles.css */
${j(upper)} {
  text-transform: none;
  font-size: 12px;
  font-weight: 500;
}
${j(tiny)} {
  font-size: 11px;
}
${j(weight)} {
  font-weight: 500;
}
`);
console.log(upper.size, tiny.size, weight.size);
