import { describe, expect, it } from 'vitest';
import { appPath, buildAppHref, parseAppPath, resolveAppLocation } from './app-location';

describe('rutas autenticadas de Nutrigo', () => {
  it('arma /app y /crm canónicos por rol', () => {
    expect(appPath('patient', 'plan')).toBe('/app/plan');
    expect(appPath('pro', 'pacientes')).toBe('/crm/pacientes');
    expect(appPath('pro', 'progreso')).toBe('/crm/progreso');
    expect(appPath('patient', 'ficha')).toBe('/app/inicio');
    expect(appPath('pro', 'ejercicio')).toBe('/crm/inicio');
  });

  it('lee la superficie y la página desde el path', () => {
    expect(parseAppPath('/app/diario')).toEqual({ surface: 'app', page: 'diario' });
    expect(parseAppPath('/crm')).toEqual({ surface: 'crm', page: 'inicio' });
    expect(parseAppPath('/')).toBeNull();
  });

  it('abre un enlace directo de paciente y corrige páginas ajenas', () => {
    expect(resolveAppLocation({ pathname: '/app/plan' })).toEqual({
      role: 'patient', page: 'plan', path: '/app/plan', replace: false,
    });
    expect(resolveAppLocation({ pathname: '/app/ficha' }).path).toBe('/app/inicio');
    expect(resolveAppLocation({ pathname: '/app/ficha' }).replace).toBe(true);
  });

  it('no deja que una sesión paciente abra el CRM por URL', () => {
    const next = resolveAppLocation({ pathname: '/crm/pacientes', lockedRole: 'patient' });
    expect(next).toEqual({ role: 'patient', page: 'inicio', path: '/app/inicio', replace: true });
  });

  it('no deja que una sesión profesional abra la app paciente por URL', () => {
    const next = resolveAppLocation({ pathname: '/app/plan', lockedRole: 'pro' });
    expect(next.role).toBe('pro');
    expect(next.path).toBe('/crm/inicio');
    expect(next.replace).toBe(true);
  });

  it('respeta #recurso= y canoniza la raíz a /app/recursos', () => {
    const next = resolveAppLocation({ pathname: '/', hash: '#recurso=leer-plan-semanal' });
    expect(next.page).toBe('recursos');
    expect(next.path).toBe('/app/recursos');
    expect(next.replace).toBe(true);
  });

  it('en demo, /crm fija el rol profesional', () => {
    expect(resolveAppLocation({ pathname: '/crm/agenda' })).toEqual({
      role: 'pro', page: 'agenda', path: '/crm/agenda', replace: false,
    });
  });

  it('limpia el selector de diseño al navegar', () => {
    expect(buildAppHref('https://plan.test/?design=nutrigo', 'patient', 'mensajes')).toBe('/app/mensajes');
    expect(buildAppHref('https://plan.test/app/recursos#recurso=x', 'patient', 'plan')).toBe('/app/plan');
    expect(buildAppHref('https://plan.test/app/recursos#recurso=x', 'patient', 'recursos', { keepHash: true })).toBe('/app/recursos#recurso=x');
  });
});
