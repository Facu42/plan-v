import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecipeMacroGrid } from './RecipePlate';
import {
  NUTRIGO_FIDELITY_NOT_VISUAL_APPROVAL,
  NUTRIGO_FIDELITY_RAILS,
  NUTRIGO_FIDELITY_SURFACES,
  NUTRIGO_NO_GLOBAL_RAIL,
  NUTRIGO_REFERENCE_PNG_MISSING,
  NV_VISUAL_LAW,
} from './nutrigo-fidelity';

const css = readFileSync(new URL('./nutrigo-fidelity.css', import.meta.url), 'utf8');

describe('NV-FIDELITY shell vs inventario', () => {
  it('fija sidebar 223 y rails 325/325/345/305 sin aprobación visual', () => {
    expect(NUTRIGO_FIDELITY_RAILS).toEqual({
      dashboard: 325,
      calendar: 325,
      'healthy-menu': 345,
      insights: 305,
    });
    expect(css).toMatch(/--nv-sidebar-width:\s*223px/);
    expect(css).toMatch(/--nv-rail-dashboard:\s*325px/);
    expect(css).toMatch(/--nv-rail-calendar:\s*325px/);
    expect(css).toMatch(/--nv-rail-menu:\s*345px/);
    expect(css).toMatch(/--nv-rail-insights:\s*305px/);
    expect(css).toMatch(/--nv-content-pad:\s*28px/);
    expect(css).toMatch(/font-family:\s*Inter/);
    expect(css).toMatch(/--nv-accent:\s*#EAFF78/);
    expect(css).toMatch(/--nv-mint:\s*#DCEFE7/);
    expect(css).toMatch(/--nv-lilac:\s*#EBE6F8/);
    expect(css).not.toMatch(/#f9b343|#ffe6ad|#F9B343/i);
    expect(css).toMatch(/border-radius:\s*999px/);
    expect(css).toMatch(/Not Facu visual approval/);
    expect(css).not.toMatch(/PLANV_NUTRIGO_VISUAL\s*=\s*1/);
    expect(NV_VISUAL_LAW.type).toBe('Inter');
    expect(NV_VISUAL_LAW.notType).toEqual(['Poppins', 'Fraunces']);
    expect(NV_VISUAL_LAW.qaDir).toBe('design/nutrigo-exports');
    expect(NUTRIGO_FIDELITY_NOT_VISUAL_APPROVAL).toMatch(/not Facu visual approval/i);
  });

  it('las ocho superficies sin rail global no reservan columna derecha', () => {
    expect(NUTRIGO_NO_GLOBAL_RAIL).toEqual([
      'messages',
      'recipe-details',
      'meal-plan',
      'grocery',
      'food-diary',
      'progress',
      'exercise',
      'insight-details',
    ]);
    for (const token of ['.nv-messaging', '.nv-grocery-page', '.nv-progress-page', '.nv-patient-diary', '.nv-patient-plan', '.nv-exercise-page', '.nv-resources-page', '.nv-meal-plan', '.nv-food-diary']) {
      expect(css).toContain(token);
    }
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/);
  });

  it('lista once superficies de fidelidad, sin Ejercicio y sin PNG todavía', () => {
    expect(NUTRIGO_FIDELITY_SURFACES.map((surface) => surface.id)).toEqual([
      'dashboard', 'calendar', 'messages', 'healthy-menu', 'recipe-details',
      'meal-plan', 'grocery', 'food-diary', 'progress', 'insights', 'insight-details',
    ]);
    expect(NUTRIGO_FIDELITY_SURFACES.some((surface) => surface.id === 'exercise')).toBe(false);
    expect(NUTRIGO_REFERENCE_PNG_MISSING).toEqual(NUTRIGO_FIDELITY_SURFACES.map((surface) => surface.id));
    expect(NUTRIGO_REFERENCE_PNG_MISSING).toHaveLength(11);
  });

  it('los macros declarados se leen como KCAL/PROT/CARBS/GRASAS', () => {
    const html = renderToStaticMarkup(<RecipeMacroGrid macros={{ kcal: 420, protein_g: 32, carbs_g: 28, fat_g: 14 }} />);
    expect(html).toContain('KCAL');
    expect(html).toContain('PROT');
    expect(html).toContain('CARBS');
    expect(html).toContain('GRASAS');
    expect(html).toContain('420');
    expect(html).not.toContain('http');
  });
});
