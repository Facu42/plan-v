import { Fragment, createElement } from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { fileURLToPath } from 'node:url';
import { AdminCrm } from './AdminCrm';

const here = fileURLToPath(new URL('.', import.meta.url));

describe('anfitrión del CRM Nutridash en /admin', () => {
  it('arma el armazón vanilla con todos los identificadores que el prototipo usa', () => {
    const html = renderToStaticMarkup(createElement(Fragment, null, createElement(AdminCrm)));
    for (const id of ['app', 'sidebar', 'topbar', 'view', 'overlay-root', 'toast-root']) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('class="nd-admin-crm"');
    expect(html).toContain('class="nd-app" id="app"');
    expect(html).toContain('aria-label="Navegación principal"');
  });

  it('no renderiza contenido del CRM de la nutricionista', () => {
    const html = renderToStaticMarkup(createElement(Fragment, null, createElement(AdminCrm)));
    expect(html).not.toContain('nv-admin-rail');
  });

  it('el port queda sin manejadores inline (la CSP de producción no permite unsafe-inline)', () => {
    // Bug latente del prototipo: inputs/select/tareas usaban oninput/onchange inline,
    // silenciosamente bloqueados en producción. Ahora van delegados vía app.js.
    const sources = ['views.js', 'app.js'].map((file) => readFileSync(here + file, 'utf8'));
    for (const source of sources) {
      expect(source).not.toMatch(/\son(?:input|click|change|submit|keyup|keydown|blur)=/);
      expect(source).not.toMatch(/onclick="document/);
    }
  });

  it('la vista del servicio queda conectada al panel real, no a la demo del prototipo', () => {
    const boot = readFileSync(here + 'boot.mjs', 'utf8');
    expect(boot).toContain('crm-service-root');
    expect(boot).toContain("ND.views.servicio");
  });
});

