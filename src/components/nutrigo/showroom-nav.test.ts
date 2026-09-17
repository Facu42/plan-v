import { describe, expect, it } from 'vitest';
import { PATIENT_CRM_PAGES, PATIENT_MORE, PATIENT_SURFACES, PATIENT_TABS, PRO_MORE, PRO_TABS, tabBarState } from './showroom-nav';

describe('navegación del espacio paciente', () => {
  it('expone las diez superficies de Nutrigo y ninguna entrada de CRM', () => {
    expect(PATIENT_SURFACES.map((tab) => tab.id)).toEqual([
      'inicio', 'agenda', 'mensajes', 'recetas', 'plan', 'compras', 'diario', 'progreso', 'ejercicio', 'recursos',
    ]);
    expect(PATIENT_SURFACES.some((tab) => PATIENT_CRM_PAGES.includes(tab.id))).toBe(false);
    expect(PATIENT_MORE.map((tab) => tab.id)).toEqual(['agenda', 'recetas', 'compras', 'progreso', 'ejercicio', 'recursos']);
  });

  it('conserva cuatro destinos en la barra móvil y marca Más fuera de ella', () => {
    expect(PATIENT_TABS.map((tab) => tab.id)).toEqual(['inicio', 'plan', 'diario', 'mensajes']);
    expect(tabBarState('inicio', PATIENT_TABS, PATIENT_MORE)).toEqual({ onPrimary: true, onMore: false, moreCurrent: false });
    expect(tabBarState('ejercicio', PATIENT_TABS, PATIENT_MORE).moreCurrent).toBe(true);
    expect(tabBarState('objetivos', PRO_TABS, PRO_MORE).moreCurrent).toBe(true);
    expect(tabBarState('pacientes', PRO_TABS, PRO_MORE).onPrimary).toBe(true);
  });
});
