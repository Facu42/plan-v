import { describe, expect, it } from 'vitest';
import { authorizePatientAction } from './authorization.js';
import type { Actor, PatientResource } from './contracts.js';

const resource: PatientResource = {
  id: 'patient-1',
  nutritionistId: 'nutri-1',
  billing_status: 'active',
  billing_until: '2099-10-06',
};

describe('authorizePatientAction', () => {
  it('returns the actor when the relation and action are allowed', async () => {
    const actor: Actor = { role: 'nutri', userId: 'user-nutri', nutritionistId: 'nutri-1' };

    await expect(authorizePatientAction('user-nutri', 'patient-1', 'review_meal', {
      getActor: async () => actor,
      getPatientResource: async () => resource,
    })).resolves.toEqual(actor);
  });

  it('separates professional assignment from patient read tracking', async () => {
    const nutri: Actor = { role: 'nutri', userId: 'user-nutri', nutritionistId: 'nutri-1' };
    const patient: Actor = { role: 'paciente', userId: 'user-patient', patientId: 'patient-1' };
    const resolvers = { getPatientResource: async () => resource };

    await expect(authorizePatientAction('user-nutri', 'patient-1', 'assign_resource', {
      ...resolvers, getActor: async () => nutri,
    })).resolves.toEqual(nutri);
    await expect(authorizePatientAction('user-patient', 'patient-1', 'assign_resource', {
      ...resolvers, getActor: async () => patient,
    })).resolves.toBeNull();
    await expect(authorizePatientAction('user-nutri', 'patient-1', 'assign_routine', {
      ...resolvers, getActor: async () => nutri,
    })).resolves.toEqual(nutri);
    await expect(authorizePatientAction('user-patient', 'patient-1', 'assign_routine', {
      ...resolvers, getActor: async () => patient,
    })).resolves.toBeNull();
    await expect(authorizePatientAction('user-patient', 'patient-1', 'read_resource', {
      ...resolvers, getActor: async () => patient,
    })).resolves.toEqual(patient);
    await expect(authorizePatientAction('user-nutri', 'patient-1', 'read_resource', {
      ...resolvers, getActor: async () => nutri,
    })).resolves.toBeNull();
  });

  it('fails closed for a cross-nutritionist patient', async () => {
    const actor: Actor = { role: 'nutri', userId: 'other-nutri', nutritionistId: 'nutri-2' };

    await expect(authorizePatientAction('other-nutri', 'patient-1', 'read_clinical', {
      getActor: async () => actor,
      getPatientResource: async () => resource,
    })).resolves.toBeNull();
  });

  it('fails closed when the profile or patient relation cannot be resolved', async () => {
    await expect(authorizePatientAction('unknown', 'patient-1', 'read_self', {
      getActor: async () => null,
      getPatientResource: async () => resource,
    })).resolves.toBeNull();

    const actor: Actor = { role: 'paciente', userId: 'user-patient', patientId: 'patient-1' };
    await expect(authorizePatientAction('user-patient', 'missing', 'read_self', {
      getActor: async () => actor,
      getPatientResource: async () => null,
    })).resolves.toBeNull();
  });
});
