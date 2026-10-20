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
    const labels = groups.flatMap(g => g.items).map(i => i.label);
    expect(labels).toEqual(expect.arrayContaining(['Recetas', 'Equivalencias', 'Modelos', 'Biblioteca', 'Centro de ayuda']));
    expect(groups.flatMap(g => g.items).map(i => i.href)).toEqual(expect.arrayContaining([
      '/crm/proximamente?modulo=asistente-ia',
      '/crm/proximamente?modulo=ayuda',
      '/crm/proximamente?modulo=equipo',
    ]));
    expect(labels).not.toContain('Todas las funciones');
    expect(groups.flatMap(g => g.items).some(i => i.href === '/crm/servicio')).toBe(false);
    expect(panelNavGroups([], 0, true).flatMap(g => g.items).some(i => i.href === '/crm/servicio')).toBe(true);
  });
});
