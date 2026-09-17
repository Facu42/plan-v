import { describe, expect, it } from 'vitest';
import { resolveModulePatientAction } from './crm-module-actions';

describe('CRM module patient actions', () => {
  it('opens appointment management from Agenda', () => {
    expect(resolveModulePatientAction('agenda', false)).toEqual({ label: 'Agendar turno', target: 'appointments' });
    expect(resolveModulePatientAction('agenda', true)).toEqual({ label: 'Gestionar turno', target: 'appointments' });
  });

  it('keeps the record action in non-scheduling modules', () => {
    expect(resolveModulePatientAction('pacientes', true)).toEqual({ label: 'Abrir ficha', target: 'record' });
  });
});
