import { describe, expect, it } from 'vitest';
import { panelNavCurrent, panelNavGroups } from './PanelNavigation';
import type { Patient } from '../../types';

describe('menú profesional', () => {
  it('abre una sola opción de cada submenú y respeta los parámetros que distinguen destinos', () => {
    expect(panelNavCurrent('/crm/pacientes', '/crm/pacientes?filtro=archived')).toBe(false);
    expect(panelNavCurrent('/crm/pacientes?filtro=archived', '/crm/pacientes?filtro=archived&paciente=abc')).toBe(true);
    expect(panelNavCurrent('/crm/biblioteca?biblioteca=recetas', '/crm/biblioteca?biblioteca=recursos')).toBe(false);
    expect(panelNavCurrent('/crm/desarrollo', '/crm/desarrollo?modulo=configuracion')).toBe(false);
  });
  it('usa los conteos de la cartera y conserva la ausencia de datos', () => {
    const patients = [{ id: 'a', has_account: false }, { id: 'b', archived_at: '2026-10-01' }] as Patient[];
    const groups = panelNavGroups(patients, 3, false);
    expect(groups.map(g => g.title)).toEqual(['Gestión', 'Acompañamiento', 'Plan', 'Recursos', 'Cuenta']);
    const children = groups[0].items.find(i => i.label === 'Pacientes')!.children!;
    expect(children.map(c => c.count)).toEqual([1, undefined, 1, 1]);
    expect(groups.flatMap(g => g.items).some(i => i.href === '/crm/servicio')).toBe(false);
    expect(panelNavGroups([], 0, true).flatMap(g => g.items).some(i => i.href === '/crm/servicio')).toBe(true);
  });
  it('deja el contador común de Pacientes antes que el naranja de Seguimiento', () => {
    const items = panelNavGroups([], 0, false).flatMap(group => group.items);
    const pacientes = items.find(item => item.label === 'Pacientes')!;
    const seguimiento = items.find(item => item.label === 'Seguimiento')!;
    expect(pacientes.count).toBe(0);
    expect(pacientes.hot).toBeUndefined();
    expect(seguimiento.count).toBe(0);
    expect(seguimiento.hot).toBe(true);
    expect(items.findIndex(item => item.label === 'Pacientes')).toBeLessThan(items.findIndex(item => item.label === 'Seguimiento'));
    expect(items.find(item => item.label === 'Agenda')!.count).toBeUndefined();
    expect(items.find(item => item.label === 'Cobranzas')!.hot).toBeUndefined();
  });
});
