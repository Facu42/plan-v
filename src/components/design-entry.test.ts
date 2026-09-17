import { describe, expect, it } from 'vitest';
import { shouldShowNutrigo } from './design-entry';

const demo = { development: true, demoMode: true, hasSession: false, supabaseEnabled: false, search: '' };

describe('entrada al diseño de la demo local', () => {
  it('abre Nutrigo en la raíz sin exigir una query', () => {
    expect(shouldShowNutrigo(demo)).toBe(true);
  });
  it('conserva el enlace explícito al nuevo diseño', () => {
    expect(shouldShowNutrigo({ ...demo, search: '?design=nutrigo' })).toBe(true);
  });
  it('permite abrir la versión anterior de forma explícita', () => {
    expect(shouldShowNutrigo({ ...demo, search: '?design=legacy' })).toBe(false);
  });
  it('abre el consultorio demo aunque el frontend tenga claves de Supabase', () => {
    expect(shouldShowNutrigo({ ...demo, supabaseEnabled: true })).toBe(true);
  });

  it.each([
    { development: false }, { demoMode: false }, { hasSession: true },
  ])('no habilita el diseño demo fuera de sus guardas: %j', (overrides) => {
    expect(shouldShowNutrigo({ ...demo, ...overrides, search: '?design=nutrigo' })).toBe(false);
  });
});
