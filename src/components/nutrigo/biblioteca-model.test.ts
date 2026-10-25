import { describe, expect, it } from 'vitest';
import { assignedReaders, assignablePatients } from './biblioteca-model';
import { SEEDED_RESOURCES } from '../../types/resources';
import type { Patient } from '../../types';

const resource = SEEDED_RESOURCES[0];
const patient = (id: string, resourceId?: string, readAt: string | null = null) => ({
  id, name: id, resource_assignments: resourceId ? [{ id: `as-${id}`, patient_id: id, resource_id: resourceId, assigned_at: '2026-10-25', read_at: readAt }] : [],
}) as Patient;

describe('Biblioteca: asignaciones reales', () => {
  it('reconoce slug e id sin mezclar otros recursos ni contar dos veces a una paciente', () => {
    const people = [patient('a', resource.slug, '2026-10-25'), patient('b', resource.id), patient('c', 'otro')];
    expect(assignedReaders(resource, people).map(r => [r.patient.id, Boolean(r.assignment.read_at)])).toEqual([['a', true], ['b', false]]);
  });
  it('solo ofrece pacientes todavía no asignadas y nunca permite asignar un borrador', () => {
    const people = [patient('a', resource.slug), patient('b')];
    expect(assignablePatients(resource, people).map(p => p.id)).toEqual(['b']);
    expect(assignablePatients({ ...resource, published: false }, people)).toEqual([]);
  });
  it('sin recurso ni asignaciones no inventa lectores', () => {
    expect(assignedReaders(null, [patient('a')])).toEqual([]);
    expect(assignablePatients(null, [patient('a')])).toEqual([]);
  });
});
