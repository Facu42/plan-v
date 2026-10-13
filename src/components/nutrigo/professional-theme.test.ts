import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Tema profesional con los colores de Nutrigo', () => {
  it('la capa del consultorio no fija una paleta alternativa a la de la paciente', () => {
    const css = readFileSync(new URL('./clinic-professional.css', import.meta.url), 'utf8');
    expect(css).not.toMatch(/--nv-(bg|card|ink|muted|accent|green|gold|forest|cta):\s*#/);
    expect(css).not.toMatch(/#083a30|#f9f6ee|#23955d|#10251e/i);
  });
  it('datos operativos e instrucciones pequeñas usan el gris oscuro de Nutrigo', () => {
    for (const name of ['professional-workspace.css', 'showroom-patient-record.css', 'showroom-patients.css', 'professional-measurements.css']) {
      expect(readFileSync(new URL(name, import.meta.url), 'utf8')).not.toContain('var(--nv-muted)');
    }
  });
});
