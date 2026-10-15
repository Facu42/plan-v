import type { IntakeHealthFact, PatientConsentStatus, ProfessionalIntakeView } from '../../types/intake';

export function healthFactLabel(fact: IntakeHealthFact | undefined, kind: 'alergias' | 'restricciones') {
  if (!fact || fact.state === 'unknown') return `Todavía no indicó ${kind}.`;
  if (fact.state === 'none') return `Declaró que no tiene ${kind}.`;
  return fact.items.length ? fact.items.join(', ') : `Declaró ${kind} sin detalle.`;
}

export function intakeMissingItems(view: Pick<ProfessionalIntakeView, 'intake' | 'consents'>): string[] {
  const payload = view.intake.payload ?? {};
  const missing: string[] = [];
  const granted = view.consents.some((event: PatientConsentStatus) => event.purpose === 'care_relationship' && event.decision === 'granted');
  if (!granted) missing.push('Consentimiento de atención vigente');
  if (!String(payload.preferred_name ?? '').trim()) missing.push('Nombre preferido');
  if (!payload.allergies || payload.allergies.state === 'unknown') missing.push('Alergias por confirmar en consulta');
  if (payload.allergies?.state === 'reported') missing.push('Alergias autodeclaradas para revisar');
  if (!payload.restrictions || payload.restrictions.state === 'unknown') missing.push('Restricciones por confirmar en consulta');
  if (view.intake.status === 'draft') missing.push('El paciente todavía no envió el ingreso');
  return missing;
}

export function intakeStatusLabel(status: string) {
  if (status === 'reviewed') return 'Revisado';
  if (status === 'submitted') return 'Pendiente de revisión';
  return 'Borrador';
}
