import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('../../nutricionistas/index.html', import.meta.url), 'utf8');
const patients = readFileSync(new URL('../../pacientes.html', import.meta.url), 'utf8');

const images = [
  '/landing/paciente-celular.jpg',
  '/landing/tostadas.jpg',
  '/landing/plato-pescado.jpg',
  '/landing/mealprep-color.jpg',
  '/landing/veronica.jpg',
  '/landing/paciente-mercado.jpg',
  '/landing/paciente-mensajes.jpg',
  '/landing/paciente-agenda.jpg',
  '/landing/cocina-banner.jpg',
  '/landing/logo.png',
];

describe('landing de Nutridash para nutricionistas', () => {
  it('copia las secciones y las imágenes de la página de pacientes', () => {
    for (const id of ['que-es', 'herramientas', 'como-empezar', 'pedila', 'hero-titulo']) {
      expect(page).toContain(`id="${id}"`);
    }
    expect(page.match(/<section /g)).toHaveLength(patients.match(/<section /g)?.length);
    expect(page.match(/class="lp-feature"/g)).toHaveLength(5);
    expect(page).not.toContain('id="precios"');
    expect(page).not.toContain('lp-cards');
    for (const src of images) expect(page).toContain(`src="${src}"`);
    expect(page).toContain('src="/src/landing/landing.ts"');
  });

  it('le habla a la nutricionista y publica los precios', () => {
    expect(page).toContain('Crear mi consultorio');
    expect(page).toContain('Nutridash para nutricionistas');
    expect(page).not.toContain('Quiero empezar');
    expect(page).not.toContain('Nutridash para pacientes');
    expect(page).toContain('$24.900');
    expect(page).toContain('$49.900');
    expect(page).toContain('$89.900');
    expect(page).toContain('$239.040');
    expect(page).toContain('$479.040');
    expect(page).toContain('$863.040');
    expect(page).toContain('$14.940');
    expect(page).toContain('$179.280');
    expect(page).toContain('No hay período de prueba');
    expect(page).toContain('no se suma al 20%');
    expect(page).toContain('primeras 30');
    expect(page).not.toMatch(/testimonio|estrellas|nutricionistas ya|% de adherencia/i);
  });

  it('deja la página de pacientes como estaba', () => {
    expect(patients).toContain('Nutridash para pacientes');
    expect(patients).toContain('Quiero empezar');
    expect(patients).not.toContain('/nutricionistas');
  });
});
