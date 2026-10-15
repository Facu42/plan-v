import { describe, expect, it } from 'vitest';
import { canUseDemoRoleSwitch, shouldShowNutrigo } from './design-entry';

const demo = { development: true, demoMode: true, hasSession: false, supabaseEnabled: false, search: '' };

describe('entrada al diseño Nutrigo', () => {
  it('abre Nutrigo en la demo local sin exigir una query', () => {
    expect(shouldShowNutrigo(demo)).toBe(true);
  });
  it('conserva el enlace explícito al nuevo diseño en demo', () => {
    expect(shouldShowNutrigo({ ...demo, search: '?design=nutrigo' })).toBe(true);
  });
  it('permite abrir la versión anterior sólo en la demo', () => {
    expect(shouldShowNutrigo({ ...demo, search: '?design=legacy' })).toBe(false);
  });
  it('abre el consultorio demo aunque el frontend tenga claves de Supabase', () => {
    expect(shouldShowNutrigo({ ...demo, supabaseEnabled: true })).toBe(true);
  });
  it('monta Nutrigo en una sesión autenticada, también fuera de DEV', () => {
    expect(shouldShowNutrigo({
      development: false, demoMode: false, hasSession: true, supabaseEnabled: true, search: '',
    })).toBe(true);
  });
  it('ignora design=legacy cuando hay sesión de producto', () => {
    expect(shouldShowNutrigo({
      development: false, demoMode: false, hasSession: true, supabaseEnabled: true, search: '?design=legacy',
    })).toBe(true);
  });
  it('no abre el showroom sin demo ni sesión', () => {
    expect(shouldShowNutrigo({ ...demo, demoMode: false, development: false })).toBe(false);
  });
  it('deja el selector de rol sólo en demo sin sesión', () => {
    expect(canUseDemoRoleSwitch(demo)).toBe(true);
    expect(canUseDemoRoleSwitch({ demoMode: true, hasSession: true })).toBe(false);
    expect(canUseDemoRoleSwitch({ demoMode: false, hasSession: true })).toBe(false);
  });
});
