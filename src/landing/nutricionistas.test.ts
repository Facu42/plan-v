import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const nutriHtml = readFileSync(new URL('../../public/nutricionistas/index.html', import.meta.url), 'utf8');
const nutriJs = readFileSync(new URL('../../public/nutricionistas/_next/static/chunks/15inwqq-a2i2v.js', import.meta.url), 'utf8');
const patientHtml = readFileSync(new URL('../../public/pacientes/index.html', import.meta.url), 'utf8');
const patientJs = readFileSync(new URL('../../public/pacientes/_next/static/chunks/15inwqq-a2i2v.js', import.meta.url), 'utf8');

const sections = [
  'Hero',
  'BrandMarquee',
  'TeSuena',
  'Features',
  'ExpandCompare',
  'WordsSticky',
  'Shopping',
  'Macros',
  'Veronica',
  'Week',
  'Tuesday',
  'Entry',
  'Faq',
  'Cierre',
  'Contact',
  'Footer',
  'FloatingCta',
];

describe('landing de Nutridash para nutricionistas', () => {
  it('copia la landing real, con el video que se abre al scroll', () => {
    expect(existsSync(new URL('../../nutricionistas/index.html', import.meta.url))).toBe(false);
    expect(nutriHtml).toContain('/nutricionistas/video/hero-loop.mp4');
    expect(nutriHtml).toContain('hero-clip');
    expect(nutriJs).toContain('scrollTrigger');
    for (const name of sections) {
      expect(nutriJs).toContain(`["${name}"`);
      expect(patientJs).toContain(`["${name}"`);
    }
  });

  it('le habla a la nutricionista y publica los precios', () => {
    expect(nutriHtml).toContain('Crear mi consultorio');
    expect(nutriHtml).toContain('Nutridash');
    expect(nutriHtml).not.toContain('Entrar a Plan V');
    expect(nutriHtml).not.toContain('en el bolsillo.');
    for (const price of ['$24.900', '$49.900', '$89.900', '$239.040', '$479.040', '$863.040', '$14.940', '$179.280', '$29.940', '$359.280', '$53.940', '$647.280']) {
      expect(nutriHtml).toContain(price);
    }
    expect(nutriHtml).toContain('No hay período de prueba');
    expect(nutriHtml).toContain('no se suma al 20%');
    expect(nutriHtml).toContain('primeras 30');
    expect(nutriHtml).not.toMatch(/testimonio|estrellas|% de adherencia/i);
  });

  it('no toca la landing de pacientes', () => {
    expect(patientHtml).toContain('en el bolsillo.');
    expect(patientHtml).toContain('/pacientes/video/hero-loop.mp4');
    expect(patientHtml).toContain('Entrar a Plan V');
    expect(patientHtml).not.toContain('Nutridash');
    expect(patientHtml).not.toContain('$24.900');
    expect(patientJs).not.toContain('Crear mi consultorio');
  });
});
