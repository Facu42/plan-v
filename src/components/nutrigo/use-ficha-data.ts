import { useEffect, useState } from 'react';
import type { Patient } from '../../types';
import type { ProfessionalIntakeView } from '../../types/intake';
import type { ClinicalWorkspaceSnapshot } from '../../types/clinical-workspace';
import type { ConsultationView } from '../../types/consultations';
import type { PatientMealPage } from '../../types/patient-meals';
import type { CrmFeedResponse } from '../../types/crm-feed';
import type { PatientQuickPreview } from '../../types/patient-preview';
import { api } from '../../api/client';
import { crmWorkApi } from '../../api/crm-work';
import { clinicalWorkspaceApi } from '../../api/clinical-workspace';
import { consultationsApi } from '../../api/consultations';
import { useCare } from './useCare';

export type FichaRelated = {
  key: string; intake: ProfessionalIntakeView | null; clinical: ClinicalWorkspaceSnapshot | null; notes: ConsultationView | null;
  meals: PatientMealPage | null; feed: CrmFeedResponse | null; vista: PatientQuickPreview | null; errors: string[];
};

/** Lo que el encabezado, las solapas y el Resumen de la ficha comparten: se pide una sola vez por paciente. Cada fuente falla por su cuenta. */
export function useFichaData(patient: Patient) {
  const { data: care, error: careError, reload } = useCare(patient.id, true);
  const [related, setRelated] = useState<FichaRelated | null>(null);
  const [revision, setRevision] = useState(0);
  const canCare = !careError && (care?.consented.includes('care_relationship') ?? false);
  const canDocs = canCare && (care?.consented.includes('clinical_document') ?? false);
  const key = `${patient.id}:${Boolean(care)}:${canCare}:${canDocs}:${revision}`;
  useEffect(() => {
    const refresh = () => setRevision(n => n + 1);
    window.addEventListener('plan-v:care-changed', refresh);
    return () => window.removeEventListener('plan-v:care-changed', refresh);
  }, []);
  useEffect(() => {
    if (!care) return;
    const controller = new AbortController();
    setRelated(null);
    void Promise.allSettled([
      api.getProfessionalIntake(patient.id, { signal: controller.signal }),
      canDocs ? clinicalWorkspaceApi.snapshot(patient.id, controller.signal) : Promise.resolve(null),
      canCare ? consultationsApi.list(patient.id, true, 0, controller.signal) : Promise.resolve(null),
      crmWorkApi.patientMeals(patient.id, { status: 'pending_review', limit: 3 }, controller.signal),
      crmWorkApi.feed({ patient_id: patient.id, days: 7 }, controller.signal),
      crmWorkApi.patientPreview(patient.id, controller.signal),
    ]).then(([intake, clinical, notes, meals, feed, vista]) => {
      if (controller.signal.aborted) return;
      const valor = <T,>(r: PromiseSettledResult<T>) => r.status === 'fulfilled' ? r.value : null;
      setRelated({
        key, intake: valor(intake), clinical: valor(clinical), notes: valor(notes), meals: valor(meals), feed: valor(feed), vista: valor(vista),
        errors: [intake.status === 'rejected' ? 'antecedentes' : null, clinical.status === 'rejected' ? 'laboratorio' : null, notes.status === 'rejected' ? 'notas' : null, meals.status === 'rejected' ? 'comidas' : null, feed.status === 'rejected' ? 'registros de la semana' : null, vista.status === 'rejected' ? 'plan' : null].filter((x): x is string => Boolean(x)),
      });
    });
    return () => controller.abort();
  }, [key]);
  return { care, careError, reload, canCare, canDocs, current: related?.key === key ? related : null, refetch: () => setRevision(n => n + 1) };
}

export type FichaData = ReturnType<typeof useFichaData>;
