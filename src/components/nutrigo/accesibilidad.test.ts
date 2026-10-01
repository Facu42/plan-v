import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

// Fallas que encontró la revisión automática de accesibilidad (axe, WCAG 2.1 AA) el 2026-09-30.
describe('accesibilidad: fallas corregidas', () => {
  it('el campo oculto de adjuntar archivo tiene nombre', () => {
    expect(read('./NutrigoMessages.tsx')).toMatch(/id="nm-attach"[^>]*aria-label="Adjuntar archivo"/);
  });

  it('el carrusel de comidas se puede recorrer con teclado', () => {
    expect(read('./ShowroomProgress.tsx')).toMatch(/className="nvpf-carousel" role="region" aria-label="[^"]+" tabIndex=\{0\}/);
  });

  it('el resumen de objetivos no mete íconos dentro de la lista de definiciones', () => {
    const goals = read('./ShowroomGoals.tsx');
    expect(goals).not.toMatch(/<dl className="nvg-stats"/);
    expect(goals).toMatch(/<div className="nvg-stats" role="group"/);
  });

  it('los toques chicos del celular tienen zona de 24 px', () => {
    expect(read('./agenda-diario-fig.css')).toMatch(/\.nvcal-categories button::after \{ content: ""; position: absolute; inset: -4px; \}/);
    expect(read('./plan-fig.css')).toMatch(/\.pf-month::before \{ content: ""; position: absolute; inset: -4px 0; \}/);
    expect(read('./care-panel.css')).toMatch(/\.care-preference-grid label\{min-height:28px\}/);
    expect(read('./nutrition-target.css')).toMatch(/\.nvt-link::after\{content:"";position:absolute;inset:-4px 0\}/);
    expect(read('./menu-fig.css')).toMatch(/\.mf-card h3 button::after, \.nv-app \.mf-link-title::after \{ content: ""; position: absolute; inset: -3px 0; \}/);
  });
});
