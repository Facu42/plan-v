import {
  canAccessPatient,
  type Actor,
  type PatientAction,
  type PatientResource,
} from './contracts.js';

type AccessResolvers = {
  getActor: (userId: string) => Promise<Actor | null>;
  getPatientResource: (patientId: string) => Promise<PatientResource | null>;
};

export async function authorizePatientAction(
  userId: string,
  patientId: string,
  action: PatientAction,
  resolvers: AccessResolvers,
): Promise<Actor | null> {
  const [actor, patient] = await Promise.all([
    resolvers.getActor(userId),
    resolvers.getPatientResource(patientId),
  ]);

  if (!actor || !patient || !canAccessPatient(actor, patient, action)) return null;
  return actor;
}
