import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEGAL_VERSION } from './legal';

const terminos = readFileSync(new URL('../public/legal/terminos.html', import.meta.url), 'utf8');
const privacidad = readFileSync(new URL('../public/legal/privacidad.html', import.meta.url), 'utf8');

describe('términos y privacidad de Nutridash', () => {
  it('deja a Nutridash como responsable de la plataforma y a la nutricionista de sus pacientes', () => {
    for (const html of [terminos, privacidad]) {
      expect(html).toContain('Nutridash (Facundo Rodríguez)');
      expect(html).toContain('artículo 25');
      expect(html).toContain('Ley 25.326');
      expect(html).toContain('Falta la revisión de un abogado');
      expect(html).toContain('CUIT: [COMPLETAR]');
      expect(html).toContain('Domicilio: [COMPLETAR]');
      expect(html).toContain('[COMPLETAR]');
    }
    expect(terminos).toContain('La nutricionista es la responsable de los datos de sus pacientes');
    expect(terminos).toContain('encargado del tratamiento');
    expect(privacidad).toContain('ella es la <strong>responsable</strong> de tus datos de salud');
    expect(privacidad).toContain('encargado del tratamiento');
    expect(terminos).toContain(`Versión ${LEGAL_VERSION}`);
    expect(privacidad).toContain(`Versión ${LEGAL_VERSION}`);
  });

  it('no publica el CUIT, el domicilio ni el mail mientras falten', () => {
    for (const html of [terminos, privacidad]) {
      expect(html).not.toContain('20-33507402-6');
      expect(html).not.toContain('Boatti');
      expect(html).not.toContain('facundorodriguez42@gmail.com');
      expect(html).not.toContain('CUIL');
    }
  });
});
