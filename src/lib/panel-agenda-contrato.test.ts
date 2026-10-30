import { describe, expect, it } from 'vitest';
// @ts-expect-error Datos de ejemplo locales del contrato, fuera del código de la app.
import { fechaAgendaContrato, snapshotAgendaEjemplo } from '../../scripts/panel-v29-agenda-ejemplo.mjs';
import { agendaDay, buildPanelAgendaEvents, weekDays } from './panel-agenda';
import { claseDeEvento, proximoEvento } from '../components/nutrigo/agenda-presentacion';

describe('muestras de Agenda del contrato v29', () => {
  for (const date of ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-12-31']) it(`conserva cada estado aunque el contrato corra el ${date}`, () => {
    const now = fechaAgendaContrato(new Date(`${date}T15:00:00Z`));
    const fixture = snapshotAgendaEjemplo(now);
    const events = buildPanelAgendaEvents([], fixture.profile.config, fixture.bookings, now, weekDays(agendaDay(now)));
    const next = proximoEvento(events, now);
    const classes = new Set(events.map(event => claseDeEvento(event, now, next)));
    for (const expected of ['c', 'v', 'w', 'd', 'n'] as const) expect(classes.has(expected), `${date}: falta ${expected}`).toBe(true);
  });
});
