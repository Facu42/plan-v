import { useEffect, useState } from 'react';
import { plansApi } from '../../api/plans';
import { careErrorMessage } from '../../api/care';
import { weekPlanFromSlots, type MealPlanView } from '../../types/plans';
import type { Patient } from '../../types';

export function usePublishedPlan(patientId: string) {
  const [published, setPublished] = useState<MealPlanView | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoaded(false);
    plansApi.board(patientId, false, controller.signal)
      .then((result) => { setPublished(result.published); setError(''); setLoaded(true); })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(careErrorMessage(err));
        setLoaded(true);
      });
    return () => controller.abort();
  }, [patientId]);
  return { published, loaded, error };
}

export function weekPlanForPatient(patient: Pick<Patient, 'weekPlan'>, published: MealPlanView | null) {
  return published ? weekPlanFromSlots(published.slots) : patient.weekPlan;
}
