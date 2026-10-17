import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Tema profesional con los colores de Nutrigo', () => {
  it('la capa del consultorio no fija una paleta alternativa a la de la paciente', () => {
    const css = readFileSync(new URL('./clinic-professional.css', import.meta.url), 'utf8');
    expect(css).not.toMatch(/--nv-(bg|card|ink|muted|accent|green|gold|forest|cta):\s*#/);
    expect(css).not.toMatch(/#083a30|#f9f6ee|#23955d|#10251e/i);
  });
  it('los textos secundarios conservan el gris original de Nutrigo', () => {
    const captions = [
      ['professional-workspace.css', '.pw-record-head p'],
      ['showroom-patient-record.css', '.nr-patient-select'],
      ['showroom-patients.css', '.nv-directory-summary dt'],
      ['professional-measurements.css', '.pm-note'],
      ['professional-dashboard.css', '.nv-pro-summary dt'],
    ];
    for (const [name, selector] of captions) {
      const css = readFileSync(new URL(name, import.meta.url), 'utf8');
      const rule = css.split('}').find(block => block.split('{')[0].split(',').map(value => value.trim()).includes(selector));
      expect(rule, `${name}: ${selector}`).toMatch(/color:\s*var\(--nv-muted\)/);
    }
  });
});
