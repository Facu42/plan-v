import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { appPath, resolveAppLocation } from '../components/nutrigo/app-location';
import { PILOTO_VIEWPORTS, TWO_ROLE_SMOKE_PAGES } from './viewports';

describe('PV-33 viewports y rutas de dos roles', () => {
  it('fija 390 y 1440 como contratos de layout, no como aprobación visual', () => {
    expect(PILOTO_VIEWPORTS.mobile).toBe(390);
    expect(PILOTO_VIEWPORTS.desktop).toBe(1440);
    const patientCss = readFileSync(new URL('../components/nutrigo/patient-dashboard.css', import.meta.url), 'utf8');
    const goalsCss = readFileSync(new URL('../components/nutrigo/showroom-goals.css', import.meta.url), 'utf8');
    expect(patientCss).toMatch(/1440 px/);
    expect(goalsCss).toMatch(/max-width:390px/);
  });

  it('arma paths canónicos paciente /app y profesional /crm para el smoke de dos roles', () => {
    for (const page of TWO_ROLE_SMOKE_PAGES.patient) {
      expect(appPath('patient', page)).toBe(`/app/${page}`);
    }
    for (const page of TWO_ROLE_SMOKE_PAGES.pro) {
      expect(appPath('pro', page)).toBe(`/crm/${page}`);
    }
  });

  it('bloquea cruzar superficies aunque la URL nombre la página del otro rol', () => {
    expect(resolveAppLocation({ pathname: '/crm/pacientes', lockedRole: 'patient' })).toMatchObject({
      role: 'patient', path: '/app/inicio', replace: true,
    });
    expect(resolveAppLocation({ pathname: '/app/plan', lockedRole: 'pro' })).toMatchObject({
      role: 'pro', path: '/crm/inicio', replace: true,
    });
  });
});
