import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('../../nutricionistas/index.html', import.meta.url), 'utf8');
const patients = readFileSync(new URL('../../pacientes.html', import.meta.url), 'utf8');

describe('landing de Nutridash para nutricionistas', () => {
  it('publica los tres precios de lista, el anual y la fundadora sin sumar descuentos', () => {
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

  it('deja la página de pacientes en su lugar y la enlaza', () => {
    expect(patients).toContain('Nutridash para pacientes');
    expect(patients).toContain('href="/nutricionistas"');
    expect(page).toContain('href="/pacientes"');
  });
});
