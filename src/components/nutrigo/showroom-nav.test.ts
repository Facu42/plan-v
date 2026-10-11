import { describe, expect, it } from 'vitest';
import { PATIENT_CRM_PAGES, PATIENT_MORE, PATIENT_SURFACES, PATIENT_TABS, PLAN_SUBPAGES, PRO_MORE, PRO_SURFACES, PRO_TABS, tabBarState } from './showroom-nav';
import { isAllowedPage } from './app-location';

describe('navegación del espacio paciente', () => {
  it('expone las diez superficies de Nutrigo y ninguna entrada de CRM', () => {
    expect(PATIENT_SURFACES.map((tab) => tab.id)).toEqual([
      'inicio', 'agenda', 'mensajes', 'recetas', 'plan', 'compras', 'diario', 'progreso', 'ejercicio', 'recursos', 'pagos',
    ]);
    expect(PATIENT_SURFACES.some((tab) => PATIENT_CRM_PAGES.includes(tab.id))).toBe(false);
    expect(PATIENT_MORE.map((tab) => tab.id)).toEqual(['agenda', 'recetas', 'compras', 'progreso', 'ejercicio', 'recursos', 'pagos']);
  });

  it('conserva cuatro destinos en la barra móvil y marca Más fuera de ella', () => {
    expect(PATIENT_TABS.map((tab) => tab.id)).toEqual(['inicio', 'plan', 'diario', 'mensajes']);
    expect(tabBarState('inicio', PATIENT_TABS, PATIENT_MORE)).toEqual({ onPrimary: true, onMore: false, moreCurrent: false });
    expect(tabBarState('ejercicio', PATIENT_TABS, PATIENT_MORE).moreCurrent).toBe(true);
    expect(tabBarState('biblioteca', PRO_TABS, PRO_MORE).moreCurrent).toBe(true);
    expect(tabBarState('pacientes', PRO_TABS, PRO_MORE).onPrimary).toBe(true);
  });
});

describe('navegación del nutricionista', () => {
  it('prioriza pacientes, fichas y planes sin perder los destinos existentes', () => {
    expect(PRO_SURFACES.map((tab) => tab.id)).toEqual([
      'inicio', 'pacientes', 'plan', 'seguimiento', 'progreso-global', 'agenda', 'mensajes', 'alimentos', 'biblioteca', 'modelos', 'cobranzas',
    ]);
    expect(PLAN_SUBPAGES.map((tab) => tab.id)).toEqual(['plan', 'compras']);
  });

  it('mantiene por enlace las pantallas que salieron del menú', () => {
    for (const page of ['reciente', 'guardado', 'paneles', 'videollamadas']) expect(isAllowedPage('pro', page)).toBe(true);
  });
});
