import { describe, expect, it } from 'vitest';
import { schedulingDefaultSettings, schedulingSettingsSchema } from '../types/scheduling';
import { agregarSede, cambiarSede, detalleDeSede, MAX_SEDES, quitarSede, sedeDelTurno } from './sedes';
import { eventosDeSede, type PanelAgendaEvent } from './panel-agenda';

const B = '00000000-0000-4000-a000-00000000000b';

describe('sedes del consultorio', () => {
  it('agrega, cambia y quita sedes sin dejar horarios ni tipos colgados', () => {
    const base = schedulingDefaultSettings();
    const A = base.calendars[0].id;
    let config = agregarSede(base, B);
    config = cambiarSede(config, B, { name: 'Palermo', address: 'Honduras 5000', modality: 'presencial' });
    config = { ...config, types: [{ id: '00000000-0000-4000-a000-0000000000c1', name: 'Consulta', calendar_id: B, duration_min: 45, channel: 'presencial', price_minor: 0, deposit_minor: 0 }], weekly: [{ calendar_id: B, weekday: 1, start: '09:00', end: '12:00' }] };
    expect(schedulingSettingsSchema.safeParse(config).success).toBe(true);
    const sin = quitarSede(config, B);
    expect(sin.calendars.map(s => s.id)).toEqual([A]);
    expect(sin.types[0].calendar_id).toBe(A);
    expect(sin.weekly[0].calendar_id).toBe(A);
    expect(quitarSede(sin, A)).toBe(sin); // nunca queda sin sedes
  });

  it('no pasa del máximo de sedes y valida la dirección', () => {
    let config = schedulingDefaultSettings();
    for (let i = 0; i < 15; i++) config = agregarSede(config);
    expect(config.calendars).toHaveLength(MAX_SEDES);
    const largo = cambiarSede(config, config.calendars[1].id, { address: 'x'.repeat(201) });
    expect(schedulingSettingsSchema.safeParse(largo).success).toBe(false);
  });

  it('describe la sede y elige la principal cuando el turno no tiene sede', () => {
    const sedes = [{ id: 'a', name: 'Centro' }, { id: 'b', name: 'Online', modality: 'online' as const, address: '' }];
    expect(detalleDeSede({ modality: 'presencial', address: 'Av. 1' })).toBe('Presencial · Av. 1');
    expect(detalleDeSede(sedes[1])).toBe('Online');
    expect(sedeDelTurno(sedes, null)).toBe('a');
    expect(sedeDelTurno(sedes, 'b')).toBe('b');
    expect(sedeDelTurno(sedes, 'borrada')).toBe('a');
  });

  it('la agenda filtra por sede y suma el nombre de la sede al turno', () => {
    const ev = (id: string, calendarId?: string, tone: PanelAgendaEvent['tone'] = 'seguimiento'): PanelAgendaEvent => ({ id, tone, title: id, subtitle: 'Consulta', day: '2026-11-05', startMin: 600, endMin: 645, calendarId });
    const sedes = [{ id: 'a', name: 'Centro' }, { id: 'b', name: 'Palermo' }];
    const todos = [ev('1'), ev('2', 'b'), ev('3', 'a', 'bloqueo')];
    expect(eventosDeSede(todos, sedes, 'b').map(e => e.id)).toEqual(['2']);
    expect(eventosDeSede(todos, sedes, 'a').map(e => e.id)).toEqual(['1', '3']);
    expect(eventosDeSede(todos, sedes, '').map(e => e.subtitle)).toEqual(['Consulta · Centro', 'Consulta · Palermo', 'Consulta']);
    expect(eventosDeSede(todos, [sedes[0]], '').map(e => e.subtitle)).toEqual(['Consulta', 'Consulta', 'Consulta']);
  });
});
